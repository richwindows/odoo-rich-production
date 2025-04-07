from odoo import models, fields, api
from datetime import date, timedelta
import logging

_logger = logging.getLogger(__name__)

class Production(models.Model):
    _name = 'rich_production.production'
    _description = 'Production Records'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    def _default_start_date(self):
        return date.today()
    
    def _default_stop_date(self):
        return date.today() + timedelta(days=1)
    
    def _default_name(self):
        return f'New Production {date.today()}'

    name = fields.Char(string='Name', required=True, tracking=True, default=_default_name)
    start_date = fields.Date(string='Start Date', required=True, default=_default_start_date, tracking=True)
    stop_date = fields.Date(string='Stop Date', required=True, default=_default_stop_date, tracking=True)
    duration = fields.Integer(compute='_compute_duration', store=True)
    all_day = fields.Boolean(string='All Day', default=True)
    user_id = fields.Many2one('res.users', string='Responsible', tracking=True, default=lambda self: self.env.user)
    color = fields.Integer(string='Color', default=0)
    
    # 批次信息
    batch = fields.Char(string='Batch')
    batch_number = fields.Char(string='Batch No.', tracking=True)
    capacity = fields.Integer(string='Capacity', default=0, tracking=True, 
                             help="Maximum capacity for this production batch")
    
    # 关联字段
    invoice_ids = fields.Many2many('account.move', string='Invoices', tracking=True,
                                 domain="[('move_type', '=', 'out_invoice')]",
                                 help="Select invoiced orders for this batch")
    customer_id = fields.Many2one('res.partner', string='Customer', tracking=True)
    total_items = fields.Integer(string='Total Items', compute='_compute_total_items', store=True)
    production_date = fields.Date(string='Production Date')
    notes = fields.Text(string='Notes')
    description = fields.Text(string='Description')
    
    # 批次信息显示
    batch_info = fields.Char(string='Batch Info', compute='_compute_batch_info', store=True)
    calendar_display = fields.Char(string='Calendar Display', compute='_compute_calendar_display', store=True)
    
    # 产品明细行
    product_line_ids = fields.One2many('rich_production.line', 'production_id', 
                                       string='Product Lines', copy=True)
    
    @api.depends('batch', 'batch_number', 'customer_id', 'total_items')
    def _compute_batch_info(self):
        for record in self:
            info = []
            if record.batch_number:
                info.append(f"批次号: {record.batch_number}")
            if record.batch:
                info.append(f"批次: {record.batch}")
            if record.customer_id:
                info.append(f"客户: {record.customer_id.name}")
            if record.total_items:
                info.append(f"数量: {record.total_items}")
            record.batch_info = " | ".join(info) or "未指定批次"
    
    @api.depends('invoice_ids')
    def _compute_total_items(self):
        for record in self:
            if record.invoice_ids:
                # 计算所有发票行项目的总数
                total = 0
                for invoice in record.invoice_ids:
                    # 遍历每个发票的行项目
                    for line in invoice.invoice_line_ids:
                        if hasattr(line, 'quantity'):
                            total += line.quantity
                        elif hasattr(line, 'product_uom_qty'):
                            total += line.product_uom_qty
                        else:
                            total += 1  # 如果没有数量字段，默认为1
                record.total_items = total
            else:
                record.total_items = 0
    
    @api.depends('start_date', 'stop_date')
    def _compute_duration(self):
        for record in self:
            if record.start_date and record.stop_date:
                delta = record.stop_date - record.start_date
                record.duration = delta.days
            else:
                record.duration = 0
    
    @api.depends('batch', 'batch_number', 'customer_id', 'total_items')
    def _compute_calendar_display(self):
        for record in self:
            parts = []
            if record.batch_number:
                parts.append(f"批次号: {record.batch_number}")
            if record.batch:
                parts.append(f"批次: {record.batch}")
            if record.customer_id:
                parts.append(f"客户: {record.customer_id.name}")
            if record.total_items:
                parts.append(f"数量: {record.total_items}")
            record.calendar_display = "\n".join(parts) or "未指定批次"
    
    @api.onchange('invoice_ids')
    def _onchange_invoice_ids(self):
        """当发票变更时更新相关字段和产品行"""
        for record in self:
            if record.invoice_ids:
                # 使用第一个发票的客户作为批次客户
                if record.invoice_ids[0].partner_id:
                    record.customer_id = record.invoice_ids[0].partner_id
                
                # 更新产品行
                self._update_product_lines_from_invoices()
                
                # 更新名称 - 如果批次号存在，使用它作为名称的基础
                if record.batch_number:
                    # 如果有多个发票，添加计数信息
                    if len(record.invoice_ids) > 1:
                        record.name = f'批次 {record.batch_number} ({len(record.invoice_ids)} 个订单)'
                    else:
                        record.name = f'批次 {record.batch_number}'
                elif record.batch:
                    if len(record.invoice_ids) > 1:
                        record.name = f'批次: {record.batch} ({len(record.invoice_ids)} 个订单)'
                    else:
                        record.name = f'批次: {record.batch}'
                else:
                    record.name = f'生产批次 ({len(record.invoice_ids)} 个订单)'
    
    def _update_product_lines_from_invoices(self):
        """从发票更新产品行数据 - 简化版本，直接复制invoice.line到product.line"""
        self.ensure_one()
        
        # 清空现有产品行
        self.product_line_ids = [(5, 0, 0)]
        product_lines = []
        
        # 遍历每个发票和行项目，直接创建产品行
        for invoice in self.invoice_ids:
            for line in invoice.invoice_line_ids:
                if not line.product_id:
                    continue

                # 基本字段
                line_vals = {
                    'product_id': line.product_id.id,
                    'quantity': line.quantity if hasattr(line, 'quantity') else 1.0,
                    'invoice_id': invoice.id,
                    'invoice_line_id': line.id,
                }
                
                # 记录所有可能的字段映射 - 包含常见命名模式
                field_mappings = {
                    # 常见的Studio自定义字段
                    'width': ['x_width', 'x_studio_width', 'width', 'window_width'],
                    'height': ['x_height', 'x_studio_height', 'height', 'window_height'],
                    'frame': ['x_frame', 'x_studio_frame', 'frame', 'frame_type'],
                    'glass': ['x_glass', 'x_studio_glass', 'glass', 'glass_type'],
                    'color': ['x_color', 'x_studio_color', 'color', 'color_type'],
                    'grid': ['x_grid', 'x_studio_grid', 'grid', 'grid_type'],
                    'argon': ['x_argon', 'x_studio_argon', 'argon', 'has_argon'],
                    'notes': ['description', 'name', 'note', 'notes'],
                    'unit_price': ['price_unit', 'unit_price'],
                    'amount': ['price_subtotal', 'amount_untaxed', 'amount'],
                }
                
                # 尝试从所有可能的字段名中获取值
                for prod_field, inv_fields in field_mappings.items():
                    for inv_field in inv_fields:
                        if hasattr(line, inv_field) and getattr(line, inv_field):
                            value = getattr(line, inv_field)
                            # 对于argon字段，确保值是布尔型
                            if prod_field == 'argon' and not isinstance(value, bool):
                                if isinstance(value, str):
                                    value = value.lower() in ['true', 'yes', 'y', '1']
                                else:
                                    value = bool(value)
                            line_vals[prod_field] = value
                            break  # 找到第一个匹配项后停止
                
                # 另外检查产品的属性字段
                if line.product_id:
                    prod = line.product_id
                    # 检查产品属性
                    product_field_mappings = {
                        'width': ['x_width', 'width', 'default_width'],
                        'height': ['x_height', 'height', 'default_height'],
                        'frame': ['x_frame', 'frame', 'frame_type'],
                        'glass': ['x_glass', 'glass', 'glass_type'],
                        'color': ['x_color', 'color', 'color_type'],
                    }
                    
                    for prod_field, prod_fields in product_field_mappings.items():
                        # 只有在行项目没有对应字段时才从产品获取
                        if prod_field not in line_vals:
                            for field_name in prod_fields:
                                if hasattr(prod, field_name) and getattr(prod, field_name):
                                    line_vals[prod_field] = getattr(prod, field_name)
                                    break
                
                # 如果有UOM信息，复制
                if hasattr(line, 'product_uom_id') and line.product_uom_id:
                    line_vals['uom_id'] = line.product_uom_id.id
                
                # 日志调试产品行数据
                _logger.debug(f"产品行数据: {line_vals}")
                
                # 添加到产品行列表
                product_lines.append((0, 0, line_vals))
        
        # 批量创建产品行        
        if product_lines:
            self.product_line_ids = product_lines
            _logger.info(f"已从发票创建 {len(product_lines)} 条产品行")
    
    def action_refresh_product_lines(self):
        """手动刷新产品行按钮操作"""
        for record in self:
            record._update_product_lines_from_invoices()
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': '刷新完成',
                'message': f'已从发票更新产品明细',
                'sticky': False,
                'type': 'success'
            }
        }
        
    def action_force_save_lines_sql(self):
        """通过直接SQL保存产品行"""
        self.ensure_one()
        if not self.invoice_ids:
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': '错误',
                    'message': '没有选择发票，无法更新产品行',
                    'sticky': False,
                    'type': 'danger'
                }
            }
            
        # 首先通过常规方法更新产品行
        self._update_product_lines_from_invoices()
        
        # 确保产品行已保存到数据库
        self.env.cr.execute("""
            SELECT COUNT(*) FROM rich_production_line 
            WHERE production_id = %s
        """, (self.id,))
        count = self.env.cr.fetchone()[0]
        
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'SQL保存成功',
                'message': f'已将{count}条产品行保存到数据库',
                'sticky': False,
                'type': 'success'
            }
        }
        
    def action_view_details(self):
        """查看详情按钮动作"""
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'rich_production.production',
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'current',
        }
        
    def action_cutting_list(self):
        """打开裁剪清单"""
        return {
            'name': '裁剪清单',
            'view_mode': 'form',
            'res_model': 'rich_production.production',
            'res_id': self.id,
            'view_id': self.env.ref('rich_production.view_rich_production_cutting_form').id,
            'type': 'ir.actions.act_window',
            'target': 'new',
            'context': {'default_id': self.id},
        }
        
    def action_print_cutting_list(self):
        """打印裁剪清单"""
        self.ensure_one()
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': '打印中',
                'message': f'正在打印批次 {self.batch_number or self.batch or "未命名"} 的裁剪清单',
                'sticky': False,
                'type': 'success',
            }
        }

    def write(self, vals):
        """覆盖写入方法，确保产品行数据正确保存"""
        print(f"[DEBUG] 写入开始，字段: {vals.keys()}")
        
        # 记录原始产品行数量
        old_lines_count = {}
        for record in self:
            old_lines_count[record.id] = len(record.product_line_ids)
        
        result = super(Production, self).write(vals)
        
        # 检查产品行是否丢失
        for record in self:
            if record.id in old_lines_count and old_lines_count[record.id] > 0 and len(record.product_line_ids) == 0:
                print(f"[DEBUG] 产品行丢失: 原有 {old_lines_count[record.id]} 行，现在有 0 行")
                if record.invoice_ids:
                    print(f"[DEBUG] 尝试恢复产品行数据...")
                    self._update_product_lines_from_invoices()
        
        return result
    
    @api.model
    def create(self, vals):
        """覆盖创建方法，确保产品行数据正确保存"""
        record = super(Production, self).create(vals)
        
        # 如果有发票但没有产品行，生成产品行
        if 'invoice_ids' in vals and vals['invoice_ids'] and not record.product_line_ids:
            print(f"[DEBUG] 创建记录时自动生成产品行")
            record._update_product_lines_from_invoices()
        
        return record 

    def action_inspect_invoice_fields(self):
        """辅助方法：检查发票行项目中的可用字段，帮助诊断字段映射问题"""
        self.ensure_one()
        
        if not self.invoice_ids:
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': '错误',
                    'message': '没有选择发票，无法检查字段',
                    'sticky': False,
                    'type': 'danger'
                }
            }
        
        # 检查第一个发票的第一个行项目
        invoice = self.invoice_ids[0]
        if not invoice.invoice_line_ids:
            return {
                'type': 'ir.actions.client',
                'tag': 'display_notification',
                'params': {
                    'title': '错误',
                    'message': '发票没有行项目',
                    'sticky': False,
                    'type': 'danger'
                }
            }
        
        line = invoice.invoice_line_ids[0]
        
        # 获取所有字段和值
        field_info = []
        for field_name in dir(line):
            # 排除私有方法和属性
            if field_name.startswith('_') or callable(getattr(line, field_name)):
                continue
                
            try:
                value = getattr(line, field_name)
                if value is not None and not field_name.startswith('message_') and not field_name.startswith('activity_'):
                    field_info.append(f"{field_name}: {value}")
            except Exception as e:
                field_info.append(f"{field_name}: 错误 - {str(e)}")
        
        # 记录到日志并显示通知
        _logger.info(f"发票行字段: {field_info}")
        
        # 特别检查与产品尺寸和材料相关的字段
        dimension_fields = ['width', 'height', 'x_width', 'x_height', 'x_studio_width', 'x_studio_height']
        material_fields = ['frame', 'glass', 'color', 'grid', 'argon', 'x_frame', 'x_glass', 'x_color']
        
        dimension_info = {}
        material_info = {}
        
        # 检查行项目字段
        for field in dimension_fields:
            if hasattr(line, field) and getattr(line, field):
                dimension_info[field] = getattr(line, field)
                
        for field in material_fields:
            if hasattr(line, field) and getattr(line, field):
                material_info[field] = getattr(line, field)
        
        # 检查产品上的字段
        if line.product_id:
            prod = line.product_id
            for field in dimension_fields:
                if hasattr(prod, field) and getattr(prod, field):
                    dimension_info[f"product.{field}"] = getattr(prod, field)
                    
            for field in material_fields:
                if hasattr(prod, field) and getattr(prod, field):
                    material_info[f"product.{field}"] = getattr(prod, field)
        
        # 记录到日志
        _logger.info(f"尺寸字段: {dimension_info}")
        _logger.info(f"材料字段: {material_info}")
        
        message = f"已检查发票 {invoice.name} 的字段。\n请查看服务器日志获取详情。"
        if dimension_info:
            message += f"\n\n尺寸信息: {', '.join([f'{k}={v}' for k,v in dimension_info.items()])}"
        if material_info:
            message += f"\n\n材料信息: {', '.join([f'{k}={v}' for k,v in material_info.items()])}"
        
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': '字段检查完成',
                'message': message,
                'sticky': True,
                'type': 'success'
            }
        } 
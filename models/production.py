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
                
                # 更新产品行 - 传递onchange上下文避免在onchange中执行SQL
                record.with_context(onchange_self=True)._update_product_lines_from_invoices()
                
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
        """从发票更新产品行数据 - 不清空现有行，采用更新或创建方式"""
        self.ensure_one()
        
        # 获取现有行的字典，以(invoice_id, line_id)为键
        existing_lines = {}
        for line in self.product_line_ids:
            if line.invoice_id and line.invoice_line_id:
                key = (line.invoice_id.id, line.invoice_line_id.id)
                existing_lines[key] = line
        
        # 记录需要保留的行ID
        line_ids_to_keep = []
        lines_to_update = []
        lines_to_create = []
        
        # 遍历每个发票和行项目
        for invoice in self.invoice_ids:
            for inv_line in invoice.invoice_line_ids:
                if not inv_line.product_id:
                    continue
                    
                key = (invoice.id, inv_line.id)
                
                # 基本字段
                line_vals = {
                    'product_id': inv_line.product_id.id,
                    'quantity': inv_line.quantity if hasattr(inv_line, 'quantity') else 1.0,
                    'invoice_id': invoice.id,
                    'invoice_line_id': inv_line.id,
                    'production_id': self.id,
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
                        if hasattr(inv_line, inv_field) and getattr(inv_line, inv_field):
                            value = getattr(inv_line, inv_field)
                            # 对于argon字段，确保值是布尔型
                            if prod_field == 'argon' and not isinstance(value, bool):
                                if isinstance(value, str):
                                    value = value.lower() in ['true', 'yes', 'y', '1']
                                else:
                                    value = bool(value)
                            line_vals[prod_field] = value
                            break  # 找到第一个匹配项后停止
                
                # 另外检查产品的属性字段
                if inv_line.product_id:
                    prod = inv_line.product_id
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
                if hasattr(inv_line, 'product_uom_id') and inv_line.product_uom_id:
                    line_vals['uom_id'] = inv_line.product_uom_id.id
                
                # 检查是更新还是创建
                if key in existing_lines:
                    # 更新现有行
                    line = existing_lines[key]
                    line_ids_to_keep.append(line.id)
                    # 移除production_id避免重复设置
                    if 'production_id' in line_vals:
                        del line_vals['production_id']
                    lines_to_update.append((1, line.id, line_vals))
                    _logger.debug(f"更新产品行: line_id={line.id}, values={line_vals}")
                else:
                    # 创建新行
                    lines_to_create.append((0, 0, line_vals))
                    _logger.debug(f"创建产品行: values={line_vals}")
        
        # 删除未匹配的行
        for line in self.product_line_ids:
            if line.id not in line_ids_to_keep:
                lines_to_update.append((2, line.id, False))  # 2表示删除
        
        # 批量更新所有行   
        update_commands = lines_to_update + lines_to_create
        if update_commands:
            self.write({'product_line_ids': update_commands})
            # 记录日志
            total_updated = len([cmd for cmd in lines_to_update if cmd[0] == 1])
            total_deleted = len([cmd for cmd in lines_to_update if cmd[0] == 2])
            total_created = len(lines_to_create)
            _logger.info(f"已处理产品行: 更新={total_updated}, 删除={total_deleted}, 创建={total_created}")
            
            # 验证处理结果 - 仅在非onchange环境中执行SQL查询
            if not self._context.get('onchange_self'):  # 检查上下文避免在onchange中执行SQL
                try:
                    # 仅当ID是实际数据库ID时执行SQL
                    if isinstance(self.id, int):
                        self.env.cr.execute("""
                            SELECT COUNT(*) FROM rich_production_line 
                            WHERE production_id = %s
                        """, (self.id,))
                        count = self.env.cr.fetchone()[0]
                        _logger.info(f"验证结果: production_id={self.id} 有 {count} 条产品行")
                except Exception as e:
                    _logger.warning(f"无法验证产品行数量: {str(e)}")
    
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
        
        # 强制提交事务
        self.env.cr.commit()
        
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
        result = super(Production, self).write(vals)
        
        # 在写入完成后，如果更新了发票，则同步更新产品行
        if 'invoice_ids' in vals and self.invoice_ids:
            # 使用事务新建游标确保完全提交
            self.env.cr.commit()
            
            # 强制刷新产品行
            for record in self:
                _logger.info(f"在write后强制更新产品行数据: production_id = {record.id}")
                record._update_product_lines_from_invoices()
                
                # 验证数据是否正确保存
                self.env.cr.execute("""
                    SELECT COUNT(*) FROM rich_production_line 
                    WHERE production_id = %s
                """, (record.id,))
                count = self.env.cr.fetchone()[0]
                _logger.info(f"验证: production_id={record.id} 有 {count} 条产品行")
        
        return result
        
    @api.model
    def create(self, vals):
        """覆盖创建方法，确保产品行数据正确保存"""
        record = super(Production, self).create(vals)
        
        # 使用事务新建游标确保完全提交
        self.env.cr.commit()
        
        # 如果有发票，不管是否有产品行，都强制更新产品行
        if 'invoice_ids' in vals and vals['invoice_ids']:
            _logger.info(f"在create后强制更新产品行数据: production_id = {record.id}")
            record._update_product_lines_from_invoices()
            
            # 验证数据是否正确保存
            self.env.cr.execute("""
                SELECT COUNT(*) FROM rich_production_line 
                WHERE production_id = %s
            """, (record.id,))
            count = self.env.cr.fetchone()[0]
            _logger.info(f"验证: production_id={record.id} 有 {count} 条产品行")
        
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
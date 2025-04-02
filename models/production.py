from odoo import models, fields, api
from datetime import date, timedelta

class Production(models.Model):
    _name = 'rich_production.production'
    _description = 'Production Records'
    _inherit = ['mail.thread', 'mail.activity.mixin']

    def _default_start_date(self):
        return date.today()
    
    def _default_stop_date(self):
        return date.today() + timedelta(days=1)
    
    def _default_name(self):
        return f'新生产记录 {date.today()}'

    name = fields.Char(string='Name', required=True, tracking=True, default=_default_name)
    start_date = fields.Date(string='Start Date', required=True, default=_default_start_date, tracking=True)
    stop_date = fields.Date(string='Stop Date', required=True, default=_default_stop_date, tracking=True)
    duration = fields.Integer(compute='_compute_duration', store=True)
    user_id = fields.Many2one('res.users', string='Responsible', tracking=True)
    color = fields.Integer(string='Color', default=0)
    description = fields.Text(string='Description')
    
    # 批次信息
    batch = fields.Char(string='Batch')
    batch_number = fields.Char(string='Batch No.', tracking=True)
    capacity = fields.Integer(string='Capacity', default=0, tracking=True, 
                             help="Maximum capacity for this production batch")
    
    # 关联字段
    invoice_id = fields.Many2one('account.move', string='Invoice', tracking=True, 
                                domain="[('move_type', '=', 'out_invoice')]")
    invoice_ids = fields.Many2many('account.move', string='Invoices', tracking=True,
                                 domain="[('move_type', '=', 'out_invoice')]",
                                 help="Select multiple invoiced orders for this batch")
    sale_order_id = fields.Many2one('sale.order', string='Sales Order', tracking=True)
    customer_id = fields.Many2one('res.partner', string='Customer', tracking=True)
    items_count = fields.Integer(string='Items', default=1)
    production_date = fields.Date(string='Production Date')
    notes = fields.Text(string='Notes')
    
    # 计算字段
    order_number = fields.Char(string='Order #', compute='_compute_order_number', store=True)
    total_items = fields.Integer(string='Total Items', compute='_compute_total_items', store=True)
    
    # 发票产品汇总信息
    invoice_products = fields.Text(string='Invoice Products', compute='_compute_invoice_products', store=True)
    product_summary = fields.Text(string='Product Summary', help="汇总的产品信息")
    
    # 批次信息显示
    batch_info = fields.Char(string='Batch Info', compute='_compute_batch_info', store=True)
    
    # 日历显示名称（自定义）
    calendar_display = fields.Char(string='Calendar Display', compute='_compute_calendar_display', store=True)
    
    # 产品明细行
    product_line_ids = fields.One2many('rich_production.product_line', 'production_id', 
                                       string='Product Lines', copy=True)
    
    @api.depends('invoice_ids')
    def _compute_invoice_products(self):
        """计算所有选中发票中的产品信息汇总"""
        for record in self:
            if not record.invoice_ids:
                record.invoice_products = False
                continue
                
            products_info = []
            product_totals = {}  # 用于合并相同产品的数量
            
            # 遍历所有发票行项目
            for invoice in record.invoice_ids:
                for line in invoice.invoice_line_ids:
                    if not line.product_id:
                        continue
                        
                    product_id = line.product_id.id
                    product_name = line.product_id.name
                    quantity = line.quantity if hasattr(line, 'quantity') else 1
                    uom = line.product_uom_id.name if hasattr(line, 'product_uom_id') else ''
                    
                    # 合并相同产品
                    key = f"{product_id}_{product_name}"
                    if key in product_totals:
                        product_totals[key]['quantity'] += quantity
                    else:
                        product_totals[key] = {
                            'name': product_name,
                            'quantity': quantity,
                            'uom': uom,
                            'invoice_name': invoice.name,
                        }
            
            # 格式化输出
            for key, data in product_totals.items():
                products_info.append(
                    f"{data['name']} - 数量: {data['quantity']} {data['uom']} (发票: {data['invoice_name']})"
                )
            
            if products_info:
                record.invoice_products = "\n".join(products_info)
            else:
                record.invoice_products = "未找到产品信息"
    
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
    
    @api.depends('invoice_id', 'sale_order_id', 'invoice_ids')
    def _compute_order_number(self):
        for record in self:
            if record.invoice_id:
                record.order_number = record.invoice_id.name
            elif record.sale_order_id:
                record.order_number = record.sale_order_id.name
            elif record.invoice_ids and len(record.invoice_ids) == 1:
                record.order_number = record.invoice_ids[0].name
            else:
                record.order_number = False
    
    @api.depends('invoice_ids', 'items_count')
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
                record.total_items = record.items_count
    
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
        for record in self:
            if record.invoice_ids:
                # 如果只有一个发票，设置为主发票
                if len(record.invoice_ids) == 1:
                    record.invoice_id = record.invoice_ids[0]
                
                # 使用第一个发票的客户作为批次客户
                if record.invoice_ids[0].partner_id:
                    record.customer_id = record.invoice_ids[0].partner_id
                
                # 自动计算项目数量
                total = 0
                # 同时记录产品信息
                products_info = []
                product_totals = {}
                
                # 清除现有的产品行
                record.product_line_ids = [(5, 0, 0)]
                product_lines = []
                
                for invoice in record.invoice_ids:
                    for line in invoice.invoice_line_ids:
                        # 计算总数量
                        if not line.product_id:
                            continue
                            
                        if hasattr(line, 'quantity'):
                            total += line.quantity
                            qty = line.quantity
                        elif hasattr(line, 'product_uom_qty'):
                            total += line.product_uom_qty
                            qty = line.product_uom_qty
                        else:
                            total += 1
                            qty = 1
                            
                        # 记录产品信息
                        product_id = line.product_id.id
                        product_name = line.product_id.name
                        uom = line.product_uom_id if hasattr(line, 'product_uom_id') else False
                        
                        # 添加到产品行
                        product_lines.append((0, 0, {
                            'product_id': product_id,
                            'quantity': qty,
                            'uom_id': uom.id if uom else False,
                            'invoice_id': invoice.id,
                        }))
                            
                        # 合并相同产品以文本显示
                        key = f"{product_id}_{product_name}"
                        if key in product_totals:
                            product_totals[key]['quantity'] += qty
                        else:
                            product_totals[key] = {
                                'name': product_name,
                                'quantity': qty,
                                'uom': uom.name if uom else '',
                                'invoice_name': invoice.name,
                            }
                
                # 更新产品行
                record.product_line_ids = product_lines
                            
                record.items_count = total
                
                # 格式化产品信息并保存到product_summary
                for key, data in product_totals.items():
                    products_info.append(
                        f"{data['name']} - 数量: {data['quantity']} {data['uom']} (发票: {data['invoice_name']})"
                    )
                
                if products_info:
                    record.product_summary = "\n".join(products_info)
                else:
                    record.product_summary = "未找到产品信息"
                
                # 同时更新计算字段
                self._compute_invoice_products()
                
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
    
    @api.onchange('invoice_id')
    def _onchange_invoice_id(self):
        for record in self:
            if record.invoice_id:
                record.customer_id = record.invoice_id.partner_id
                if record.batch:
                    record.name = f'批次: {record.batch} - {record.invoice_id.name}'
                else:
                    record.name = f'Production for {record.invoice_id.name}'
                
    @api.onchange('sale_order_id')
    def _onchange_sale_order_id(self):
        for record in self:
            if record.sale_order_id:
                record.customer_id = record.sale_order_id.partner_id
                if record.batch:
                    record.name = f'批次: {record.batch} - {record.sale_order_id.name}'
                else:
                    record.name = f'Production for {record.sale_order_id.name}'
                
    @api.onchange('batch', 'batch_number')
    def _onchange_batch(self):
        for record in self:
            # 当批次更改时确保始终设置名称
            if record.batch_number:
                record.name = f'批次 {record.batch_number}'
            elif record.batch:
                if record.invoice_id:
                    record.name = f'批次: {record.batch} - {record.invoice_id.name}'
                elif record.sale_order_id:
                    record.name = f'批次: {record.batch} - {record.sale_order_id.name}'
                else:
                    record.name = f'批次: {record.batch}'
            # 确保始终有名称，即使没有batch和batch_number
            elif not record.name:
                record.name = f'生产记录 {fields.Date.today()}'
    
    def action_view_details(self):
        """打开订单详情表单视图"""
        self.ensure_one()
        return {
            'type': 'ir.actions.act_window',
            'res_model': 'rich_production.production',
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'current',
        }
        
    def action_cutting_list(self):
        """显示裁剪清单"""
        self.ensure_one()
        return {
            'name': f'Cutting List for {self.order_number}',
            'type': 'ir.actions.act_window',
            'res_model': 'rich_production.production',
            'res_id': self.id,
            'view_mode': 'form',
            'target': 'new',
            'context': {'form_view_ref': 'rich_production.view_rich_production_cutting_form'},
        }
        
    def action_print_cutting_list(self):
        """打印裁剪清单"""
        self.ensure_one()
        return {
            'type': 'ir.actions.client',
            'tag': 'display_notification',
            'params': {
                'title': 'Printing',
                'message': f'Printing cutting list for order {self.order_number}',
                'sticky': False,
                'type': 'success',
            }
        } 
# -*- coding: utf-8 -*-

from odoo import models, fields, api
from datetime import timedelta

class Production(models.Model):
    _name = 'rich_production.production'
    _description = 'Production Record'
    _inherit = ['mail.thread']

    name = fields.Char(string='Name', required=True)
    
    # 日历视图所需字段
    start_date = fields.Date(string='Start Date', required=True)
    stop_date = fields.Date(string='End Date', required=True)
    duration = fields.Integer(string='Duration (Days)', compute='_compute_duration', store=True)
    all_day = fields.Boolean(string='All Day', default=True)
    
    # 日历视图颜色字段
    color = fields.Integer(string='Color', default=0)
    
    # 其他业务字段
    description = fields.Text(string='Description')
    user_id = fields.Many2one('res.users', string='Responsible', default=lambda self: self.env.user)
    note = fields.Text('Notes')

    @api.depends('start_date', 'stop_date')
    def _compute_duration(self):
        for record in self:
            if record.start_date and record.stop_date:
                delta = (record.stop_date - record.start_date).days
                record.duration = delta + 1  # 包括起始日和结束日
            else:
                record.duration = 0
                
    @api.onchange('start_date', 'duration')
    def _onchange_duration(self):
        if self.start_date and self.duration and self.duration > 0:
            self.stop_date = self.start_date + timedelta(days=self.duration - 1)
    
    @api.onchange('stop_date')
    def _onchange_stop_date(self):
        if self.start_date and self.stop_date and self.stop_date < self.start_date:
            self.stop_date = self.start_date

class ProductionLine(models.Model):
    _name = 'rich_production.line'
    _description = 'Production Line'
    
    production_id = fields.Many2one('rich_production.production', string='Production', required=True, ondelete='cascade')
    product_id = fields.Many2one('product.product', string='Product', required=True)
    quantity = fields.Float(string='Quantity', required=True, default=1.0)
    uom_id = fields.Many2one('uom.uom', string='Unit of Measure')
    note = fields.Text(string='Note')
    notes = fields.Text(string='Notes')
    
    # 发票相关字段
    invoice_id = fields.Many2one('account.move', string='Source Invoice')
    invoice_line_id = fields.Many2one('account.move.line', string='Invoice Line')
    
    # 产品基本信息
    product_name = fields.Char(string='Product Name', related='product_id.name', store=True)
    invoice_name = fields.Char(string='Invoice Number', related='invoice_id.name', store=True)
    
    # 尺寸信息
    width = fields.Char(string='Width')
    height = fields.Char(string='Height')
    
    # 材料信息
    frame = fields.Char(string='Frame')
    glass = fields.Char(string='Glass')
    color = fields.Char(string='Color')
    
    # 附加选项
    grid = fields.Char(string='Grid')
    argon = fields.Boolean(string='Argon', default=False)
    
    # 价格信息
    unit_price = fields.Float(string='Unit Price')
    tax_percent = fields.Float(string='Tax %')
    amount = fields.Float(string='Amount')
    
    def name_get(self):
        return [(rec.id, f"{rec.product_name} - {rec.quantity} ({rec.invoice_name})" if rec.product_name else "New Line") for rec in self]


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
    uom_id = fields.Many2one('uom.uom', string='Unit of Measure', related='product_id.uom_id', readonly=True)
    note = fields.Text(string='Note')


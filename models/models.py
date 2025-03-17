# -*- coding: utf-8 -*-

from odoo import models, fields, api

class Production(models.Model):
    _name = 'rich_production.production'
    _description = 'Production Order'
    
    name = fields.Char('Name')
    start_date = fields.Datetime('Start Date', required=True, default=fields.Datetime.now)
    stop_date = fields.Datetime('End Date')
    duration = fields.Float('Duration', compute='_compute_duration', store=True)
    
    product_name = fields.Char('Product Name', required=True)
    quantity = fields.Integer('Quantity', required=True, default=1)
    production_date = fields.Date('Production Date', default=fields.Date.today)
    note = fields.Text('Notes')

    @api.depends('start_date', 'stop_date')
    def _compute_duration(self):
        for record in self:
            if record.start_date and record.stop_date:
                duration = (record.stop_date - record.start_date).total_seconds() / 3600
                record.duration = round(duration, 2)
            else:
                record.duration = 0.0

class ProductionLine(models.Model):
    _name = 'rich_production.line'
    _description = 'Production Line'
    
    production_id = fields.Many2one('rich_production.production', string='Production Order', required=True)
    product_id = fields.Many2one('product.product', string='Product', required=True)
    quantity = fields.Integer('Quantity', required=True, default=1)
    note = fields.Text('Production Notes')
    sequence = fields.Integer('Sequence', default=10)


from odoo import models, fields, api

class ProductionProductLine(models.Model):
    _name = 'rich_production.product_line'
    _description = '生产批次产品明细'

    production_id = fields.Many2one('rich_production.production', string='Production Batch')
    product_id = fields.Many2one('product.product', string='Product')
    quantity = fields.Float(string='Quantity', default=1.0)
    uom_id = fields.Many2one('uom.uom', string='Unit of Measure')
    invoice_id = fields.Many2one('account.move', string='Source Invoice')
    
    product_name = fields.Char(string='Product Name', related='product_id.name', store=True)
    invoice_name = fields.Char(string='Invoice Number', related='invoice_id.name', store=True) 
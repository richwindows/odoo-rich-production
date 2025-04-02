from odoo import models, fields

class AccountMove(models.Model):
    _inherit = 'account.move'
    
    production_id = fields.Many2one('rich_production.production', string='Production') 
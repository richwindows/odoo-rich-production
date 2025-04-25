from odoo import models, fields


class WindowCalculationFormula(models.Model):
    _name = 'window.calculation.formula'
    _description = 'Window Calculation Formula'
    _order = 'style_name, formula_type, sequence, id'

    style_name = fields.Char(string='Style Name', required=True, index=True,
                             help="Identifier for the window style, often corresponding to the JS file name (e.g., 'xo_ox_window').")
    formula_type = fields.Selection([
        ('nailon', 'Nailon'),
        ('other', 'Other')
    ], string='Formula Type', required=True, index=True,
       help="Type of formula within the style (e.g., 'Nailon' specific calculations)." )
    step_name = fields.Char(string='Step Name', required=True,
                          help="Descriptive name for the calculation step or the variable being calculated (e.g., 'frameWidth').")
    formula_string = fields.Text(string='Formula String', required=True,
                               help="The exact line of code representing the formula (e.g., 'const frameWidth = mmToInch(widthMm + 3 * 2);').")
    sequence = fields.Integer(string='Sequence', default=10,
                            help="Order in which the formulas should be evaluated or displayed.")
    description = fields.Text(string='Description',
                            help="Optional description or comments about the formula.") 
# -*- coding: utf-8 -*-
{
    'name': 'Rich Production',
    'summary': 'Production Management with Calendar and Order List',
    'description': """
        Production Records Management
        - Track production start and end dates
        - Standard Odoo calendar view
        - Order list management
        - Cutting list functionality
    """,
    'version': '18.0.1.0.0',
    'author': 'Your Company',
    'depends': ['base', 'mail', 'contacts', 'sale_management', 'account', 'web'],
    'data': [
        'security/ir.model.access.csv',
        'data/window_calculation_formula_data.xml',
        'data/material_config_data.xml',
        'views/window_calculation_formula_views.xml',
        'views/assets.xml',
        'views/action_views.xml',
        'views/production_views.xml',
        'views/menu_views.xml',
        'views/cutting_list_report_view.xml',
        'views/material_config_views.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'category': 'Manufacturing',
    'assets': {
        'web.assets_backend': [
            'rich_production/static/src/js/rich_production_calendar.js',
            'rich_production/static/src/js/window_calculations/xo_ox_window.js',
            'rich_production/static/src/js/cutting_list_preview.js',
            'rich_production/static/src/xml/cutting_list_preview.xml',
            'rich_production/static/src/css/rich_production.css'
        ],
    },
}


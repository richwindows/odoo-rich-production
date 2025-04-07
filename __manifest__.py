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
        'security/security.xml',
        'security/ir.model.access.csv',
        'views/assets.xml',
        'views/action_views.xml',
        'views/production_views.xml',
        'views/menu_views.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
    'category': 'Manufacturing',
}


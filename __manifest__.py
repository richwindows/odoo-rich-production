# -*- coding: utf-8 -*-
{
    'name': 'Rich Production',
    'version': '1.0',
    'category': 'Manufacturing',
    'summary': 'Production Management Module',
    'sequence': 1,
    'depends': ['base', 'web'],
    'data': [
        'security/ir.model.access.csv',
        'views/production_views.xml',
    ],
    'installable': True,
    'application': True,
    'auto_install': False,
}


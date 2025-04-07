# -*- coding: utf-8 -*-
from odoo import models, api, _
import logging

_logger = logging.getLogger(__name__)

class ResLang(models.Model):
    _inherit = 'res.lang'
    
    @api.model
    def _lang_get(self, lang_code):
        """简化语言获取，不调用jsonb_path_query_first"""
        if not lang_code:
            lang_code = 'en_US'
        langs = self.sudo().search([('code', '=', lang_code)])
        if not langs:
            return self.sudo().search([('code', '=', 'en_US')])[0]
        return langs[0]
    
    @api.model
    def _lang_get_code(self, lang_code):
        """简化语言代码获取方法"""
        if not lang_code:
            return 'en_US'
        return lang_code 
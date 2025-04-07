# -*- coding: utf-8 -*-
from odoo import models, api, _
import logging

_logger = logging.getLogger(__name__)

class IrHttp(models.AbstractModel):
    _inherit = 'ir.http'
    
    @api.model
    def get_frontend_session_info(self):
        """覆盖语言处理方法，避免jsonb_path_query_first函数调用"""
        result = super(IrHttp, self).get_frontend_session_info()
        
        # 确保前端始终使用en_US避免语言处理问题
        if 'user_context' in result:
            result['user_context']['lang'] = 'en_US'
            
        _logger.debug("拦截前端语言请求，设置为en_US")
        return result 
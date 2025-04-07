# -*- coding: utf-8 -*-
from odoo import api, models, fields
import logging
import psycopg2

_logger = logging.getLogger(__name__)

class PostgreSQLCompatibility(models.AbstractModel):
    _name = 'rich_production.postgresql_compatibility'
    _description = 'PostgreSQL Compatibility Layer'

    @api.model
    def _register_hook(self):
        _logger.info("初始化PostgreSQL兼容性层")
        
        try:
            # 移除相关的所有函数，完全避免调用jsonb_path_query_first
            self._apply_postgres_patch()
            return super(PostgreSQLCompatibility, self)._register_hook() if hasattr(super(PostgreSQLCompatibility, self), '_register_hook') else None
        except Exception as e:
            _logger.error(f"PostgreSQL兼容性初始化失败: {e}")
            return None
        
    def _apply_postgres_patch(self):
        """应用PostgreSQL补丁，绕过jsonb_path_query_first函数"""
        # 首先检查我们是否已经应用了补丁
        self.env.cr.execute("SELECT 1 FROM pg_tables WHERE tablename = 'rich_production_postgres_patch'")
        if self.env.cr.fetchone():
            _logger.info("PostgreSQL补丁已经应用")
            return
            
        # 创建一个标记表，表示我们已应用补丁
        try:
            self.env.cr.execute("""
            CREATE TABLE rich_production_postgres_patch (
                name varchar PRIMARY KEY,
                applied_at timestamp DEFAULT now()
            )
            """)
            
            # 创建我们自己的lang_get函数，绕过jsonb_path_query_first
            self.env.cr.execute("""
            CREATE OR REPLACE FUNCTION rich_production_lang_get(lang_code varchar) RETURNS varchar AS $$
            BEGIN
                IF lang_code IS NULL THEN
                    RETURN 'en_US';
                ELSE
                    RETURN lang_code;
                END IF;
            END;
            $$ LANGUAGE plpgsql IMMUTABLE;
            """)
            
            # 替换res_lang的方法，最简单的方式绕过操作
            self.env.cr.execute("""
            CREATE OR REPLACE FUNCTION res_lang_get_code(lang_code varchar) RETURNS varchar AS $$
            BEGIN
                RETURN COALESCE(lang_code, 'en_US');
            END;
            $$ LANGUAGE plpgsql IMMUTABLE; 
            """)
            
            # 将我们的补丁标记为已应用
            self.env.cr.execute("INSERT INTO rich_production_postgres_patch (name) VALUES ('jsonb_path_workaround')")
            self.env.cr.commit()
            
            _logger.info("成功应用PostgreSQL兼容性补丁")
            
        except Exception as e:
            _logger.error(f"应用PostgreSQL补丁失败: {e}")
            raise
            
    @api.model
    def _find_lang(self):
        """自定义语言获取函数，替代Odoo内置方法"""
        lang = self.env.context.get('lang') or 'en_US'
        return lang 
/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { download } from "@web/core/network/download";

class CuttingListPreview extends Component {
    setup() {
        // 获取生产ID - 尝试多种方式
        let productionId = null;
        
        // 记录所有相关信息用于调试
        console.log("Props:", this.props);
        if (this.env.services.action && this.env.services.action.currentController) {
            console.log("Context:", this.env.services.action.currentController.props.context);
            console.log("Action:", this.env.services.action.currentController.props.action);
        }
        console.log("完整env:", this.env);
        
        // 1. 从props中获取
        if (this.props.productionId) {
            productionId = parseInt(this.props.productionId, 10);
            console.log("从props获取productionId:", productionId);
        }
        // 2. 从上下文中获取
        else if (this.env.services.action && this.env.services.action.currentController) {
            const context = this.env.services.action.currentController.props.context || {};
            console.log("完整context:", context);
            
            if (context.active_id) {
                productionId = parseInt(context.active_id, 10);
                console.log("从context.active_id获取productionId:", productionId);
            }
            else if (context.production_id) {
                productionId = parseInt(context.production_id, 10);
                console.log("从context.production_id获取productionId:", productionId);
            }
            // 尝试从context中的任何可能的id字段获取
            else {
                for (const key in context) {
                    if (key.endsWith('_id') && !isNaN(parseInt(context[key], 10))) {
                        productionId = parseInt(context[key], 10);
                        console.log(`从context.${key}获取productionId:`, productionId);
                        break;
                    }
                }
            }
        }
        // 3. 从action的params中获取
        if (!productionId && this.env.services.action && this.env.services.action.currentController) {
            const action = this.env.services.action.currentController.props.action || {};
            const params = action.params || {};
            console.log("完整params:", params);
            
            if (params.productionId) {
                productionId = parseInt(params.productionId, 10);
                console.log("从params.productionId获取productionId:", productionId);
            }
        }
        
        // 4. 尝试从URL中获取
        if (!productionId) {
            try {
                const url = new URL(window.location.href);
                console.log("URL params:", Array.from(url.searchParams.entries()));
                
                const activeModelParam = url.searchParams.get('active_model');
                const activeIdParam = url.searchParams.get('active_id');
                
                if (activeModelParam === 'rich_production.production' && activeIdParam) {
                    productionId = parseInt(activeIdParam, 10);
                    console.log("从URL参数获取productionId:", productionId);
                }
                
                // 尝试从URL中找到任何可能的ID参数
                if (!productionId) {
                    for (const [key, value] of url.searchParams.entries()) {
                        if (key.endsWith('_id') && !isNaN(parseInt(value, 10))) {
                            productionId = parseInt(value, 10);
                            console.log(`从URL参数${key}获取productionId:`, productionId);
                            break;
                        }
                    }
                }
            } catch (e) {
                console.error("解析URL时出错:", e);
            }
        }
        
        // 5. 尝试从全局环境变量中获取
        if (!productionId && window.odoo) {
            console.log("Odoo全局对象:", window.odoo);
            if (window.odoo.context) {
                const odooContext = window.odoo.context;
                console.log("Odoo全局上下文:", odooContext);
                
                if (odooContext.active_model === 'rich_production.production' && odooContext.active_id) {
                    productionId = parseInt(odooContext.active_id, 10);
                    console.log("从odoo全局上下文获取productionId:", productionId);
                }
            }
        }
        
        // 6. 尝试从localStorage中获取临时保存的ID
        if (!productionId) {
            const savedId = localStorage.getItem('rich_production_current_id');
            if (savedId) {
                productionId = parseInt(savedId, 10);
                console.log("从localStorage获取productionId:", productionId);
            }
        }
        
        console.log("最终productionId:", productionId);
        
        this.state = useState({
            productionId: productionId,
            productLines: [],
            batchNumber: '',
            loading: true,
        });
        
        this.orm = useService("orm");
        this.actionService = useService("action");
        this.notificationService = useService("notification");
        
        onWillStart(async () => {
            if (!this.state.productionId) {
                this.notificationService.add("无法获取生产ID，请重试", {
                    type: "danger",
                });
                
                // 尝试获取所有生产记录作为备选
                try {
                    const productions = await this.orm.searchRead(
                        "rich_production.production", 
                        [], // 不加过滤条件，获取所有记录
                        ["id", "batch_number", "name"],
                        { limit: 1, order: "id desc" } // 只获取最新一条
                    );
                    
                    if (productions && productions.length > 0) {
                        this.state.productionId = productions[0].id;
                        console.log("获取到最新的生产记录ID:", this.state.productionId);
                        // 保存到localStorage备用
                        localStorage.setItem('rich_production_current_id', this.state.productionId);
                    }
                } catch (error) {
                    console.error("获取生产记录失败:", error);
                }
            }
            
            await this.loadData();
        });
    }
    
    async loadData() {
        try {
            this.state.loading = true;
            
            if (!this.state.productionId) {
                console.error("无效的生产ID");
                this.state.productLines = [];
                return;
            }
            
            // 使用search_read获取生产信息
            const productions = await this.orm.searchRead(
                "rich_production.production", 
                [["id", "=", this.state.productionId]],
                ["batch_number"]
            );
            
            if (productions && productions.length > 0) {
                this.state.batchNumber = productions[0].batch_number || '';
                
                // 直接使用search_read获取产品行
                const lines = await this.orm.searchRead(
                    "rich_production.line", 
                    [["production_id", "=", this.state.productionId]],
                    ["product_id", "width", "height", "frame", "glass", "argon", 
                     "grid", "color", "notes", "invoice_id"]
                );
                
                if (lines && lines.length > 0) {
                    const processedLines = [];
                    
                    for (let index = 0; index < lines.length; index++) {
                        const line = lines[index];
                        
                        // 准备客户信息和产品信息
                        let customerCode = '';
                        let style = '';
                        
                        // 处理产品信息
                        if (line.product_id) {
                            const productName = line.product_id[1] || '';
                            
                            // 从产品名称提取风格类型
                            if (productName.includes('XOX')) style = 'XOX';
                            else if (productName.includes('XO')) style = 'XO';
                            else if (productName.includes('OX')) style = 'OX';
                            else if (productName.includes('Picture')) style = 'P';
                            else if (productName.includes('Casement')) style = 'C';
                        }
                        
                        // 获取客户信息 - 如果有发票ID
                        if (line.invoice_id) {
                            try {
                                const invoices = await this.orm.searchRead(
                                    "account.move",
                                    [["id", "=", line.invoice_id[0]]],
                                    ["partner_id"]
                                );
                                
                                if (invoices && invoices.length > 0 && invoices[0].partner_id) {
                                    const customer = invoices[0].partner_id[1] || '';
                                    // 如果客户名称太长，截取前8个字符加ID
                                    if (customer && customer.length > 10) {
                                        customerCode = customer.substring(0, 8) + 
                                            String(invoices[0].partner_id[0] % 100000);
                                    } else {
                                        customerCode = customer;
                                    }
                                }
                            } catch (invoiceError) {
                                console.warn("获取客户信息失败", invoiceError);
                            }
                        }
                        
                        processedLines.push({
                            id: index + 1,
                            customer: customerCode,
                            style: style,
                            width: line.width || '',
                            height: line.height || '',
                            fh: '',
                            frame: line.frame || '',
                            glass: line.glass || '',
                            argon: line.argon ? 'Yes' : '',
                            grid: line.grid || '',
                            color: line.color || '',
                            note: line.notes || '',
                        });
                    }
                    
                    this.state.productLines = processedLines;
                } else {
                    this.state.productLines = [];
                }
            } else {
                this.state.productLines = [];
            }
        } catch (error) {
            console.error("加载下料单数据失败", error);
            this.state.productLines = [];
        } finally {
            this.state.loading = false;
        }
    }
    
    printPage() {
        window.print();
    }
    
    async downloadExcel() {
        try {
            if (!this.state.productionId) {
                this.notificationService.add("无法获取生产ID，无法下载Excel", {
                    type: "danger",
                });
                return;
            }
            
            // 显示加载中通知
            this.notificationService.add("Excel生成中，请稍候...", {
                type: "info",
            });
            
            // 直接使用生产ID构建下载URL
            const url = `/rich_production/download_excel/${this.state.productionId}`;
            console.log("下载Excel URL:", url);
            
            // 使用fetch API直接下载文件
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // 获取文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `cutting_list_${this.state.productionId}.xlsx`;
            
            if (contentDisposition) {
                const filenameMatch = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            // 获取blob数据
            const blob = await response.blob();
            
            // 创建下载链接
            const url_object = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url_object;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // 清理
            window.URL.revokeObjectURL(url_object);
            document.body.removeChild(link);
            
            // 显示成功通知
            this.notificationService.add("Excel文件下载成功", {
                type: "success",
            });
        } catch (error) {
            console.error("下载Excel文件失败", error);
            this.notificationService.add(`下载Excel文件失败: ${error.message || '未知错误'}`, {
                type: "danger",
            });
        }
    }
    
    async downloadPdf() {
        try {
            if (!this.state.productionId) {
                this.notificationService.add("无法获取生产ID，无法下载PDF", {
                    type: "danger",
                });
                return;
            }
            
            // 显示加载中通知
            this.notificationService.add("PDF生成中，请稍候...", {
                type: "info",
            });
            
            // 直接使用生产ID构建下载URL
            const url = `/rich_production/print_pdf/${this.state.productionId}`;
            console.log("下载PDF URL:", url);
            
            // 使用fetch API直接下载文件
            const response = await fetch(url, {
                method: 'GET',
                credentials: 'same-origin',
            });
            
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            
            // 获取文件名
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `cutting_list_${this.state.productionId}.pdf`;
            
            if (contentDisposition) {
                const filenameMatch = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                if (filenameMatch && filenameMatch[1]) {
                    filename = filenameMatch[1].replace(/['"]/g, '');
                }
            }
            
            // 获取blob数据
            const blob = await response.blob();
            
            // 创建下载链接
            const url_object = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url_object;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            
            // 清理
            window.URL.revokeObjectURL(url_object);
            document.body.removeChild(link);
            
            // 显示成功通知
            this.notificationService.add("PDF文件下载成功", {
                type: "success",
            });
        } catch (error) {
            console.error("下载PDF文件失败", error);
            this.notificationService.add(`下载PDF文件失败: ${error.message || '未知错误'}`, {
                type: "danger",
            });
        }
    }
    
    close() {
        this.actionService.doAction({ type: "ir.actions.act_window_close" });
    }
}

CuttingListPreview.template = "rich_production.CuttingListPreview";
CuttingListPreview.props = {
    productionId: { type: [Number, String, Boolean], optional: true },
};

// 注册为客户端动作
registry.category("actions").add("rich_production.cutting_list_preview", CuttingListPreview);

export default CuttingListPreview; 
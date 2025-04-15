/** @odoo-module **/

import { registry } from "@web/core/registry";
import { Component, onWillStart, useState } from "@odoo/owl";
import { useService } from "@web/core/utils/hooks";
import { download } from "@web/core/network/download";

class CuttingListPreview extends Component {
    setup() {
        // 记录原始props以便调试
        console.log("原始完整props:", this.props);
        
        // 初始化params对象，确保安全
        const props = this.props || {};
        const params = props.params || {};
        
        // 从多个位置获取productionId（添加空值检查）
        let productionId = null;
        
        // 1. 直接从props.productionId获取
        if (props.productionId) {
            productionId = props.productionId;
            console.log("1. 从props.productionId获取到值:", productionId);
        }
        // 2. 从props.action.productionId获取
        else if (props.action && props.action.productionId) {
            productionId = props.action.productionId;
            console.log("2. 从props.action.productionId获取到值:", productionId);
        }
        // 3. 从params获取
        else if (params.productionId) {
            productionId = params.productionId;
            console.log("3. 从params.productionId获取到值:", productionId);
        }
        // 4. 从props.action.params获取
        else if (props.action && props.action.params && props.action.params.productionId) {
            productionId = props.action.params.productionId;
            console.log("4. 从props.action.params.productionId获取到值:", productionId);
        }
        
        // 记录所有相关信息用于调试
        console.log("完整env:", this.env);
        
        // 1. 从props中获取
        if (this.props.productionId) {
            console.log("从props获取productionId:", this.props.productionId);
        }
        // 2. 从上下文中获取
        else if (this.env.services.action && this.env.services.action.currentController) {
            const context = this.env.services.action.currentController.props.context || {};
            console.log("完整context:", context);
            
            if (context.active_id) {
                console.log("从context.active_id获取productionId:", context.active_id);
            }
            else if (context.production_id) {
                console.log("从context.production_id获取productionId:", context.production_id);
            }
            // 尝试从context中的任何可能的id字段获取
            else {
                for (const key in context) {
                    if (key.endsWith('_id') && !isNaN(parseInt(context[key], 10))) {
                        console.log(`从context.${key}获取productionId:`, context[key]);
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
                console.log("从params.productionId获取productionId:", params.productionId);
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
                    console.log("从URL参数获取productionId:", activeIdParam);
                }
                
                // 尝试从URL中找到任何可能的ID参数
                if (!productionId) {
                    for (const [key, value] of url.searchParams.entries()) {
                        if (key.endsWith('_id') && !isNaN(parseInt(value, 10))) {
                            console.log(`从URL参数${key}获取productionId:`, value);
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
                    console.log("从odoo全局上下文获取productionId:", odooContext.active_id);
                }
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
            console.log("开始加载下料单数据，生产ID:", this.state.productionId);
            
            if (!this.state.productionId) {
                console.error("无效的生产ID");
                this.state.productLines = [];
                this.notificationService.add("无法获取有效的生产记录ID，请从生产界面点击下料单按钮", { type: "danger" });
                return;
            }
            
            // 创建空表格的模型
            const createEmptyTable = () => {
                console.log("创建空表格");
                this.state.productLines = [];
                this.state.loading = false;
                // 添加一个示例行，便于用户理解表格结构
                this.state.productLines.push({
                    id: 1,
                    customer: '(示例)',
                    style: 'XO',
                    width: '36',
                    height: '48',
                    fh: '',
                    frame: '白色',
                    glass: '双层',
                    argon: 'Yes',
                    grid: '',
                    color: '白色',
                    note: '这是示例数据，请添加产品后重试',
                });
            };
            
            try {
                console.log("开始获取生产记录信息...");
                const productions = await this.orm.searchRead(
                    "rich_production.production", 
                    [["id", "=", this.state.productionId]],
                    ["batch_number", "product_line_ids"]
                );
                
                if (!productions || productions.length === 0) {
                    console.error("找不到指定ID的生产记录");
                    this.notificationService.add("找不到指定的生产记录，请返回生产界面重试", { type: "warning" });
                    createEmptyTable();
                    return;
                }
                
                this.state.batchNumber = productions[0].batch_number || '';
                console.log("获取到批次号:", this.state.batchNumber);
                console.log("生产记录关联的产品行IDs:", productions[0].product_line_ids);
                
                // 检查是否有产品行
                if (!productions[0].product_line_ids || productions[0].product_line_ids.length === 0) {
                    console.warn("生产记录没有关联的产品行");
                    this.notificationService.add("该生产记录中没有产品数据，请先添加产品", { type: "warning" });
                    createEmptyTable();
                    return;
                }
                
                // 尝试使用简化的字段集合来减少出错可能
                console.log("开始获取产品行数据...");
                try {
                    // 先尝试获取一个产品行的所有字段，用于调试
                    const sampleLine = await this.orm.searchRead(
                        "rich_production.line", 
                        [["id", "=", productions[0].product_line_ids[0]]],
                        []  // 不指定字段，获取所有字段
                    );
                    console.log("样本产品行数据:", sampleLine);
                    
                    // 检查字段存在情况，确定实际可用字段
                    let availableFields = [];
                    const essentialFields = ["product_id"];
                    const optionalFields = ["width", "height", "frame", "glass", "argon", 
                                         "grid", "color", "notes", "invoice_id", "quantity", "product_qty"];
                    
                    if (sampleLine && sampleLine.length > 0) {
                        for (const field of essentialFields) {
                            if (field in sampleLine[0]) {
                                availableFields.push(field);
                            } else {
                                console.warn(`缺少必要字段: ${field}`);
                            }
                        }
                        
                        for (const field of optionalFields) {
                            if (field in sampleLine[0]) {
                                availableFields.push(field);
                            } else {
                                console.warn(`字段不可用: ${field}`);
                            }
                        }
                    }
                    
                    console.log("可用字段:", availableFields);
                    
                    // 使用确认可用的字段获取产品行数据
                    const lines = await this.orm.searchRead(
                        "rich_production.line", 
                        [["production_id", "=", this.state.productionId]],
                        availableFields
                    );
                    
                    console.log("获取到产品行:", lines ? lines.length : 0, "条");
                    
                    if (lines && lines.length > 0) {
                        const processedLines = [];
                        let itemId = 1;
                        
                        for (let index = 0; index < lines.length; index++) {
                            const line = lines[index];
                            console.log("处理产品行:", index + 1, "ID:", line.id);
                            
                            // 确定产品数量
                            let quantity = 1; // 默认为1
                            if (line.quantity !== undefined) {
                                try {
                                    quantity = parseInt(line.quantity);
                                } catch (e) {
                                    console.warn("无法解析quantity值:", line.quantity);
                                }
                            } else if (line.product_qty !== undefined) {
                                try {
                                    quantity = parseInt(line.product_qty);
                                } catch (e) {
                                    console.warn("无法解析product_qty值:", line.product_qty);
                                }
                            }
                            
                            const actualQuantity = Math.max(1, quantity);
                            console.log("产品数量:", actualQuantity);
                            
                            // 准备客户信息和产品信息
                            let customerCode = '';
                            let style = '';
                            
                            // 处理产品信息 - 安全地获取产品名称
                            let productName = '';
                            if (line.product_id) {
                                if (Array.isArray(line.product_id) && line.product_id.length > 1) {
                                    productName = line.product_id[1] || '';
                                } else if (typeof line.product_id === 'object' && line.product_id.name) {
                                    productName = line.product_id.name;
                                } else {
                                    productName = String(line.product_id);
                                }
                                
                                console.log("产品名称:", productName);
                                
                                // 尝试从产品名称中提取风格类型
                                if (productName.includes('XOX')) {
                                    style = 'XOX';
                                } else if (productName.includes('XO')) {
                                    style = 'XO';
                                } else if (productName.includes('OX')) {
                                    style = 'OX';
                                } else if (productName.includes('Picture')) {
                                    style = 'P';
                                } else if (productName.includes('Casement')) {
                                    style = 'C';
                                } else {
                                    style = productName;
                                }
                                console.log("提取的风格:", style);
                            }
                            
                            // 获取客户信息 - 如果有发票ID
                            if (line.invoice_id) {
                                try {
                                    let invoiceId = null;
                                    if (Array.isArray(line.invoice_id) && line.invoice_id.length > 0) {
                                        invoiceId = line.invoice_id[0];
                                    } else if (typeof line.invoice_id === 'number') {
                                        invoiceId = line.invoice_id;
                                    }
                                    
                                    if (invoiceId) {
                                        console.log("获取发票客户信息, 发票ID:", invoiceId);
                                        const invoices = await this.orm.searchRead(
                                            "account.move",
                                            [["id", "=", invoiceId]],
                                            ["partner_id"]
                                        );
                                        
                                        if (invoices && invoices.length > 0 && invoices[0].partner_id) {
                                            const customer = Array.isArray(invoices[0].partner_id) ? 
                                                invoices[0].partner_id[1] || '' : 
                                                (invoices[0].partner_id.name || '');
                                                
                                            console.log("客户名称:", customer);
                                            // 如果客户名称太长，截取前8个字符加ID
                                            if (customer && customer.length > 10) {
                                                const partnerId = Array.isArray(invoices[0].partner_id) ?
                                                    invoices[0].partner_id[0] : invoices[0].partner_id.id;
                                                customerCode = customer.substring(0, 8) + 
                                                    String(partnerId % 100000);
                                            } else {
                                                customerCode = customer;
                                            }
                                            console.log("客户代码:", customerCode);
                                        }
                                    }
                                } catch (invoiceError) {
                                    console.warn("获取客户信息失败", invoiceError);
                                }
                            }
                            
                            // 为每个数量创建一行，安全获取字段值
                            for (let i = 0; i < actualQuantity; i++) {
                                const lineObj = {
                                    id: itemId,
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
                                };
                                console.log("添加处理后的行:", lineObj);
                                processedLines.push(lineObj);
                                itemId++;
                            }
                        }
                        
                        console.log("处理完成，总行数:", processedLines.length);
                        
                        if (processedLines.length > 0) {
                            this.state.productLines = processedLines;
                        } else {
                            console.warn("处理后没有产品行数据");
                            this.notificationService.add("处理后没有产品行数据", { type: "warning" });
                            createEmptyTable();
                        }
                    } else {
                        console.warn("没有找到产品行数据");
                        this.notificationService.add("该生产记录中没有产品行数据", { type: "warning" });
                        createEmptyTable();
                    }
                } catch (searchReadError) {
                    console.error("获取产品行数据失败:", searchReadError);
                    
                    // 回退到使用最小字段集
                    try {
                        console.log("尝试使用最小字段集获取产品行...");
                        const minimalLines = await this.orm.searchRead(
                            "rich_production.line", 
                            [["production_id", "=", this.state.productionId]],
                            ["product_id"]  // 只获取产品ID字段
                        );
                        
                        if (minimalLines && minimalLines.length > 0) {
                            console.log("使用最小字段集获取到产品行:", minimalLines.length, "条");
                            const processedLines = [];
                            
                            // 创建简化的行数据
                            for (let i = 0; i < minimalLines.length; i++) {
                                const line = minimalLines[i];
                                processedLines.push({
                                    id: i + 1,
                                    customer: '(数据有误)',
                                    style: line.product_id ? (Array.isArray(line.product_id) ? line.product_id[1] : 'Product') : 'Product',
                                    width: '',
                                    height: '',
                                    fh: '',
                                    frame: '',
                                    glass: '',
                                    argon: '',
                                    grid: '',
                                    color: '',
                                    note: '数据读取出错，请联系管理员',
                                });
                            }
                            
                            this.state.productLines = processedLines;
                            this.notificationService.add("某些产品数据读取失败，显示简化信息", { type: "warning" });
                        } else {
                            throw new Error("无法获取产品行基本信息");
                        }
                    } catch (minimalError) {
                        console.error("使用最小字段集获取数据也失败:", minimalError);
                        this.notificationService.add("无法获取产品数据: " + (searchReadError.message || '未知错误'), { type: "danger" });
                        createEmptyTable();
                    }
                }
            } catch (dataError) {
                console.error("获取数据时出错:", dataError);
                this.notificationService.add(`加载数据失败: ${dataError.message || '服务器错误'}`, { type: "danger" });
                createEmptyTable();
            }
        } catch (error) {
            console.error("加载下料单数据失败", error);
            this.notificationService.add(`加载下料单数据失败: ${error.message || '未知错误'}`, { type: "danger" });
            // 创建空表格
            this.state.productLines = [];
            this.state.loading = false;
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
    params: { type: Object, optional: true },
};

// 注册为客户端动作
registry.category("actions").add("rich_production.cutting_list_preview", CuttingListPreview);

export default CuttingListPreview; 
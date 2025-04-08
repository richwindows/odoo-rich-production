// FullCalendar Implementation for Rich Production - v3.1.0 (Odoo 18/Owl)
import { Component, onWillStart, onMounted, onWillUnmount, useRef, useState, xml } from "@odoo/owl";
import { registry } from "@web/core/registry";
import { useService } from "@web/core/utils/hooks";

class FullCalendarView extends Component {
    setup() {
        this.actionService = useService("action");
        this.orm = useService("orm"); // Use ORM service for data fetching
        this.notificationService = useService("notification");
        this.calendarRef = useRef("calendar"); // Ref to the calendar div
        this.calendar = null; // To hold the FullCalendar instance
        this.state = useState({ events: [] });

        console.log("FullCalendar Owl Component Setup");

        onWillStart(async () => {
            // Pre-load data if necessary, or just check library
             if (typeof FullCalendar === 'undefined') {
                console.error("FullCalendar library not loaded! Check assets.xml and file existence in static/lib.");
                this.notificationService.add(
                    "FullCalendar library not loaded. Calendar cannot be initialized.",
                    {type: "danger"}
                );
            }
        });

        onMounted(() => {
            this._initCalendar();
            this._loadEvents(); // Load events after calendar is initialized
        });

        onWillUnmount(() => {
            if (this.calendar) {
                this.calendar.destroy();
                this.calendar = null;
                console.log("FullCalendar instance destroyed.");
            }
        });
    }

    _initCalendar() {
        if (typeof FullCalendar === 'undefined' || !this.calendarRef.el) {
            console.error("Cannot initialize Calendar: FullCalendar library or target element missing.");
            return;
        }
        
        const self = this; // Maintain reference if needed inside callbacks
        this.calendar = new FullCalendar.Calendar(this.calendarRef.el, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,dayGridWeek,listWeek'
            },
            height: 'auto', // 使用自动高度
            contentHeight: 'auto', // 内容高度自动
            aspectRatio: 1.1, // 进一步降低比例，让格子更高
            handleWindowResize: true, // 自动处理窗口大小变化
            timeZone: 'local', // 使用本地时区，不做UTC转换
            fixedWeekCount: false, // 不固定显示6周，只显示当前月的实际周数
            showNonCurrentDates: false, // 不显示非当前月的日期
            buttonText: { today: 'Today', month: 'Month', week: 'Week', list: 'List' },
            firstDay: 1,
            weekNumbers: true,
            navLinks: true,
            editable: true,
            dayMaxEvents: 6, // 增加每天显示的事件数量
            moreLinkClick: 'popover', // 点击"+更多"时显示弹窗
            eventTimeFormat: { hour: '2-digit', minute: '2-digit', meridiem: false, hour12: false },
            events: this.state.events, // Initially bind to state
            eventClick: (info) => this._openEventForm(info.event),
            eventDrop: (info) => this._updateEventDates(info.event),
            eventResize: (info) => this._updateEventDates(info.event),
            dateClick: (info) => this._createNewProductionOnDate(info.date),
            eventDidMount: (info) => this._enhanceEventDisplay(info.el, info.event),
            loading: (isLoading) => console.log(isLoading ? "Calendar loading..." : "Calendar loaded."),
            // 视图特定设置
            views: {
                dayGridMonth: {
                    dayMaxEvents: 6,
                    expandRows: true, // 扩展行高度以填满可用空间
                },
                dayGridWeek: {
                    height: 'auto',
                    contentHeight: 'auto',
                    dayMaxEvents: false, // 周视图不限制事件数量
                    expandRows: true, // 扩展行高度以填满可用空间
                    stickyHeaderDates: false // 禁用粘性头部以避免滚动问题
                }
            },
            datesSet: (info) => {
                // 当视图变化时调整容器和滚动行为
                setTimeout(() => {
                    const isWeekView = info.view.type === 'dayGridWeek';
                    const isMonthView = info.view.type === 'dayGridMonth';
                    const container = this.calendarRef.el.closest('.o_fullcalendar_container');
                    const calendarView = container?.querySelector('.o_fullcalendar_view');
                    
                    if (container) {
                        if (isWeekView) {
                            container.style.height = 'calc(100vh - 80px)';
                        } else if (isMonthView) {
                            // 月视图设置更大高度并启用滚动
                            container.style.height = 'auto';
                            container.style.minHeight = 'calc(100vh - 120px)';
                            if (calendarView) {
                                calendarView.style.overflowY = 'auto';
                            }
                        } else {
                            container.style.height = '100%';
                        }
                    }
                }, 100);
            }
        });

        this.calendar.render();
        console.log("FullCalendar rendered using Owl component.");
    }

    async _loadEvents() {
        try {
            const records = await this.orm.searchRead(
                'rich_production.production',
                [], // domain
                ['name', 'batch', 'batch_number', 'customer_id', 'start_date', 'stop_date', 'color', 'notes', 'invoice_ids', 'total_items']
            );
            const events = this._formatEvents(records);
            this.state.events = events; // Update component state
            if (this.calendar) {
                this.calendar.removeAllEvents();
                this.calendar.addEventSource(events);
                console.log(`Loaded ${events.length} events via ORM service.`);
            }
        } catch (error) {
            console.error("Error loading events via ORM service:", error);
            this.notificationService.add("Failed to load events", { type: "danger" });
        }
    }
    
    _formatEvents(records) {
        // 使用本地日期，避免时区转换问题
        return records.map(record => {
            // 创建本地日期，确保日期显示在正确的格子上
            const createLocalDate = (dateString) => {
                if (!dateString) return null;
                
                // 从日期字符串中提取年月日
                const parts = dateString.split('-');
                if (parts.length < 3) return null;
                
                // 创建日期对象，月份索引从0开始
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // 月份是0-11
                const day = parseInt(parts[2]);
                
                // 创建日期时强制使用本地日期的年月日部分
                return new Date(year, month, day);
            };

            const startDate = record.start_date ? createLocalDate(record.start_date) : null;
            const endDate = record.stop_date ? createLocalDate(record.stop_date) : null;
            const customerName = record.customer_id ? record.customer_id[1] : '';

            if (!startDate) {
                console.warn(`Record ID ${record.id} has invalid start date: ${record.start_date}`);
                return null;
            }
            
            // 只使用批次号作为标题，不添加任何前缀
            const title = record.batch_number || record.name || 'Unnamed Production';
            
            return {
                id: record.id,
                title: title,
                start: startDate,
                end: endDate,
                allDay: true, // 全天事件
                backgroundColor: record.color || '#3788d8',
                borderColor: record.color || '#3788d8',
                extendedProps: {
                    batch: record.batch || '',
                    batch_number: record.batch_number || '',
                    customer: customerName,
                    notes: record.notes || '',
                    record_id: record.id
                }
            };
        }).filter(event => event !== null);
    }

    _enhanceEventDisplay(eventEl, event) {
        if (!event.extendedProps) return;

        const batch = event.extendedProps.batch;
        const customer = event.extendedProps.customer;
        const total_items = event.extendedProps.total_items;
        const invoiceCount = event.extendedProps.invoice_ids ? event.extendedProps.invoice_ids.length : 0;

        const infoContainer = document.createElement('div');
        infoContainer.className = 'fc-event-extra-info text-xs opacity-90 mt-1';

        // 不再显示批次号，因为已经作为标题显示了
        // 仅显示其他附加信息

        if (batch) {
            const batchEl = document.createElement('div');
            batchEl.textContent = `批次: ${batch}`;
            infoContainer.appendChild(batchEl);
        }

        if (customer) {
            const customerEl = document.createElement('div');
            customerEl.textContent = `客户: ${customer}`;
            infoContainer.appendChild(customerEl);
        }

        if (total_items) {
            const itemsEl = document.createElement('div');
            itemsEl.textContent = `总数量: ${total_items}`;
            infoContainer.appendChild(itemsEl);
        }

        if (invoiceCount > 0) {
            const invoicesEl = document.createElement('div');
            invoicesEl.textContent = `发票数: ${invoiceCount}`;
            infoContainer.appendChild(invoicesEl);
        }

        const titleContainer = eventEl.querySelector('.fc-event-title-container') || eventEl.querySelector('.fc-event-main');
        if (titleContainer && infoContainer.children.length > 0) {
            titleContainer.appendChild(infoContainer);
        }
        
        if (event.extendedProps.notes) {
            eventEl.setAttribute('title', event.extendedProps.notes);
        }
    }

    _openEventForm(event) {
        if (!event.extendedProps || !event.extendedProps.record_id) return;
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'rich_production.production',
            res_id: event.extendedProps.record_id,
            views: [[false, 'form']],
            target: 'current',
            context: this.env.searchModel?.globalContext || {}
        });
    }

    async _updateEventDates(event) {
        if (!event.extendedProps || !event.extendedProps.record_id) return;
        
        // 使用本地日期格式，避免时区问题
        const formatLocalDate = (date) => {
            if (!date) return false;
            
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            
            return `${year}-${month}-${day}`;
        };
        
        const data = {
            start_date: formatLocalDate(event.start),
            stop_date: event.end ? formatLocalDate(event.end) : false
        };

        try {
             await this.orm.write('rich_production.production', [event.extendedProps.record_id], data);
            console.log(`Event ${event.id} dates updated via ORM service.`);
        } catch(error) {
             console.error(`Error updating event ${event.id} via ORM service:`, error);
            event.revert();
            this.notificationService.add("Failed to update event date", { type: "danger" });
        }
    }

    _createNewProduction() {
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'rich_production.production',
            views: [[false, 'form']],
            target: 'current',
            context: { 'default_create': true }
        });
    }

    _createNewProductionOnDate(date) {
        // 使用本地日期格式
        const toLocalDateString = (date) => {
            return date.getFullYear() + '-' + 
                   String(date.getMonth() + 1).padStart(2, '0') + '-' + 
                   String(date.getDate()).padStart(2, '0');
        };

        const dateStr = toLocalDateString(date);
        this.actionService.doAction({
            type: 'ir.actions.act_window',
            res_model: 'rich_production.production',
            views: [[false, 'form']],
            target: 'current',
            context: {
                'default_create': true,
                default_start_date: dateStr,
                default_production_date: dateStr,
            }
        });
    }
}

// 更新Production Calendar模板，移除按钮
FullCalendarView.template = xml`
    <div class="o_fullcalendar_container d-flex flex-column">
        <div class="text-center my-3">
            <h3 class="text-primary">Production Calendar</h3>
        </div>
        <div class="o_fullcalendar_view flex-grow-1 overflow-auto px-4" style="height: auto; min-height: calc(100vh - 150px);">
            <div class="fc-calendar-container" t-ref="calendar"></div>
        </div>
    </div>
`;

// 添加ScheduleCalendarView组件，继承自FullCalendarView但使用不同的筛选条件
class ScheduleCalendarView extends FullCalendarView {
    setup() {
        this.actionService = useService("action");
        this.orm = useService("orm"); // Use ORM service for data fetching
        this.notificationService = useService("notification");
        this.calendarRef = useRef("calendar"); // Ref to the calendar div
        this.calendar = null; // To hold the FullCalendar instance
        this.state = useState({ events: [] });

        console.log("Schedule Calendar Owl Component Setup");

        onWillStart(async () => {
            // Pre-load data if necessary, or just check library
             if (typeof FullCalendar === 'undefined') {
                console.error("FullCalendar library not loaded! Check assets.xml and file existence in static/lib.");
                this.notificationService.add(
                    "FullCalendar library not loaded. Calendar cannot be initialized.",
                    {type: "danger"}
                );
            }
        });

        onMounted(() => {
            this._initCalendar();
            this._loadEvents(); // Load events after calendar is initialized
        });

        onWillUnmount(() => {
            if (this.calendar) {
                this.calendar.destroy();
                this.calendar = null;
                console.log("Schedule Calendar instance destroyed.");
            }
        });
    }
    
    // 重写_loadEvents方法，加载所有invoice数据
    async _loadEvents() {
        try {
            // 从account.move模型加载所有发票数据
            const invoices = await this.orm.searchRead(
                'account.move',
                [
                    ['move_type', '=', 'out_invoice'] // 只加载客户发票，但不限制delivery_date
                ],
                ['name', 'partner_id', 'invoice_date', 'delivery_date', 'amount_total', 'currency_id', 'payment_state', 'state']
            );
            
            // 格式化发票数据为日历事件
            const events = this._formatInvoiceEvents(invoices);
            this.state.events = events; // 更新组件状态
            
            if (this.calendar) {
                this.calendar.removeAllEvents();
                this.calendar.addEventSource(events);
                console.log(`Loaded ${events.length} invoice events for Schedule Calendar.`);
            }
        } catch (error) {
            console.error("Error loading invoice events:", error);
            this.notificationService.add("Failed to load invoice data", { type: "danger" });
        }
    }
    
    // 格式化发票数据为日历事件，使用delivery_date或fallback到invoice_date
    _formatInvoiceEvents(invoices) {
        return invoices.map(invoice => {
            // 创建本地日期，确保日期显示在正确的格子上
            const createLocalDate = (dateString) => {
                if (!dateString) return null;
                
                // 从日期字符串中提取年月日
                const parts = dateString.split('-');
                if (parts.length < 3) return null;
                
                // 创建日期对象，月份索引从0开始
                const year = parseInt(parts[0]);
                const month = parseInt(parts[1]) - 1; // 月份是0-11
                const day = parseInt(parts[2]);
                
                // 创建日期时强制使用本地日期的年月日部分
                return new Date(year, month, day);
            };

            // 优先使用delivery_date，如果没有则使用invoice_date
            let eventDate = null;
            let dateSource = '';
            
            if (invoice.delivery_date) {
                eventDate = createLocalDate(invoice.delivery_date);
                dateSource = 'delivery';
            } else if (invoice.invoice_date) {
                eventDate = createLocalDate(invoice.invoice_date);
                dateSource = 'invoice';
            }
            
            if (!eventDate) {
                console.warn(`Invoice ${invoice.id} has no valid date (delivery or invoice)`);
                return null;
            }
            
            // 获取客户名称
            const partnerName = invoice.partner_id ? invoice.partner_id[1] : '';
            // 获取货币符号
            const currencySymbol = invoice.currency_id ? invoice.currency_id[1].split(' ')[0] : '¥';
            
            // 设置事件标题
            let title = invoice.name || `Invoice #${invoice.id}`;
            
            // 根据付款状态设置事件颜色
            let backgroundColor = '#8e44ad'; // 默认紫色
            let textColor = '#FFFFFF';
            
            switch(invoice.payment_state) {
                case 'paid':
                    backgroundColor = '#27ae60'; // 已付款-绿色
                    break;
                case 'partial':
                    backgroundColor = '#f39c12'; // 部分付款-橙色
                    break;
                case 'not_paid':
                    backgroundColor = '#e74c3c'; // 未付款-红色
                    break;
                default:
                    backgroundColor = '#3498db'; // 其他状态-蓝色
                    break;
            }
            
            // 如果是使用invoice_date作为备选，给一个不同的颜色标记
            if (dateSource === 'invoice') {
                // 给颜色加上透明度，表示这是基于发票日期而非交付日期
                backgroundColor = backgroundColor + '99'; // 添加透明度
            }
            
            return {
                id: `invoice-${invoice.id}`,
                title: title,
                start: eventDate,
                end: eventDate,
                allDay: true,
                backgroundColor: backgroundColor,
                borderColor: backgroundColor,
                textColor: textColor,
                extendedProps: {
                    recordType: 'invoice',
                    recordId: invoice.id,
                    partner: partnerName,
                    amount: `${currencySymbol} ${invoice.amount_total.toLocaleString()}`,
                    invoiceDate: invoice.invoice_date,
                    deliveryDate: invoice.delivery_date,
                    dateSource: dateSource, // 标记日期来源
                    state: invoice.state,
                    paymentState: invoice.payment_state
                }
            };
        }).filter(event => event !== null);
    }

    // 重写事件显示增强方法，显示发票特定信息和日期来源
    _enhanceEventDisplay(eventEl, event) {
        if (!event.extendedProps) return;
        
        // 检查是否为发票记录
        if (event.extendedProps.recordType === 'invoice') {
            const partner = event.extendedProps.partner;
            const amount = event.extendedProps.amount;
            const paymentState = event.extendedProps.paymentState;
            const dateSource = event.extendedProps.dateSource;
            
            // 创建一个包含更多信息的内容
            const infoContainer = document.createElement('div');
            infoContainer.className = 'fc-event-extra-info text-xs opacity-90 mt-1';
            
            if (partner) {
                const partnerEl = document.createElement('div');
                partnerEl.textContent = `客户: ${partner}`;
                infoContainer.appendChild(partnerEl);
            }
            
            if (amount) {
                const amountEl = document.createElement('div');
                amountEl.textContent = `金额: ${amount}`;
                infoContainer.appendChild(amountEl);
            }
            
            if (paymentState) {
                const stateEl = document.createElement('div');
                let stateText = '';
                
                switch(paymentState) {
                    case 'paid':
                        stateText = '已付款';
                        break;
                    case 'partial':
                        stateText = '部分付款';
                        break;
                    case 'not_paid':
                        stateText = '未付款';
                        break;
                    default:
                        stateText = paymentState;
                        break;
                }
                
                stateEl.textContent = `状态: ${stateText}`;
                infoContainer.appendChild(stateEl);
            }
            
            // 添加日期类型指示
            if (dateSource) {
                const dateEl = document.createElement('div');
                if (dateSource === 'delivery') {
                    dateEl.textContent = '交付日期';
                } else if (dateSource === 'invoice') {
                    dateEl.textContent = '发票日期';
                    dateEl.className = 'text-warning';
                }
                infoContainer.appendChild(dateEl);
            }
            
            const titleContainer = eventEl.querySelector('.fc-event-title-container') || eventEl.querySelector('.fc-event-main');
            if (titleContainer && infoContainer.children.length > 0) {
                titleContainer.appendChild(infoContainer);
            }
        }
    }

    // 重写事件点击方法，打开对应的发票表单
    _openEventForm(event) {
        if (!event.extendedProps) return;
        
        // 检查是否为发票记录
        if (event.extendedProps.recordType === 'invoice' && event.extendedProps.recordId) {
            this.actionService.doAction({
                type: 'ir.actions.act_window',
                res_model: 'account.move',
                res_id: event.extendedProps.recordId,
                views: [[false, 'form']],
                target: 'current'
            });
        }
    }
}

// 添加Schedule Calendar自定义模板，移除所有按钮，添加标题
ScheduleCalendarView.template = xml`
    <div class="o_fullcalendar_container d-flex flex-column">
        <div class="text-center my-3">
            <h3 class="text-primary">Schedule Calendar</h3>
        </div>
        <div class="o_fullcalendar_view flex-grow-1 overflow-auto px-4" style="height: auto; min-height: calc(100vh - 150px);">
            <div class="fc-calendar-container" t-ref="calendar"></div>
        </div>
    </div>
`;

// 添加DeliveryCalendarView组件，继承自FullCalendarView
class DeliveryCalendarView extends FullCalendarView {
    setup() {
        this.actionService = useService("action");
        this.orm = useService("orm"); // Use ORM service for data fetching
        this.notificationService = useService("notification");
        this.calendarRef = useRef("calendar"); // Ref to the calendar div
        this.calendar = null; // To hold the FullCalendar instance
        this.state = useState({ events: [] });

        console.log("Delivery Calendar Owl Component Setup");

        onWillStart(async () => {
            // Pre-load data if necessary, or just check library
             if (typeof FullCalendar === 'undefined') {
                console.error("FullCalendar library not loaded! Check assets.xml and file existence in static/lib.");
                this.notificationService.add(
                    "FullCalendar library not loaded. Calendar cannot be initialized.",
                    {type: "danger"}
                );
            }
        });

        onMounted(() => {
            this._initCalendar();
            // 不加载任何数据
        });

        onWillUnmount(() => {
            if (this.calendar) {
                this.calendar.destroy();
                this.calendar = null;
                console.log("Delivery Calendar instance destroyed.");
            }
        });
    }
    
    // 重写_loadEvents方法，不加载任何数据
    async _loadEvents() {
        // 空方法，不加载任何数据
        console.log("Delivery Calendar - No data to load");
        return;
    }
    
    // 重写_createNewProduction方法，不执行任何操作
    _createNewProduction() {
        // 空方法，不执行任何操作
        return;
    }
    
    // 重写_createNewProductionOnDate方法，不执行任何操作
    _createNewProductionOnDate(date) {
        // 空方法，不执行任何操作
        return;
    }
}

// 添加Delivery Calendar自定义模板，添加标题
DeliveryCalendarView.template = xml`
    <div class="o_fullcalendar_container d-flex flex-column">
        <div class="text-center my-3">
            <h3 class="text-primary">Delivery Calendar</h3>
        </div>
        <div class="o_fullcalendar_view flex-grow-1 overflow-auto px-4" style="height: auto; min-height: calc(100vh - 150px);">
            <div class="fc-calendar-container" t-ref="calendar"></div>
        </div>
    </div>
`;

// 注册所有view
registry.category("actions").add("rich_production.fullcalendar_action", FullCalendarView);
registry.category("actions").add("rich_production.schedule_calendar_action", ScheduleCalendarView);
registry.category("actions").add("rich_production.delivery_calendar_action", DeliveryCalendarView);

export default FullCalendarView; 
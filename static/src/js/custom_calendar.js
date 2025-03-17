odoo.define('rich_production.custom_calendar', function (require) {
    'use strict';
    
    var core = require('web.core');
    var ajax = require('web.ajax');
    
    $(document).ready(function() {
        const calendarEl = document.getElementById('calendar');
        
        if (!calendarEl) return;
        
        const calendar = new FullCalendar.Calendar(calendarEl, {
            initialView: 'dayGridMonth',
            headerToolbar: {
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
            },
            editable: true,
            selectable: true,
            selectMirror: true,
            dayMaxEvents: true,
            events: function(info, successCallback, failureCallback) {
                // 从Odoo后端获取事件数据
                ajax.jsonRpc('/production/calendar/data', 'call', {
                    start: info.startStr,
                    end: info.endStr
                }).then(function(events) {
                    successCallback(events);
                }).guardedCatch(function(error) {
                    failureCallback(error);
                });
            },
            select: function(info) {
                // 用户选择了时间段，弹出创建事件的对话框
                const title = prompt('Please enter a title for the production event:');
                if (title) {
                    // 创建新事件
                    ajax.jsonRpc('/production/calendar/create', 'call', {
                        title: title,
                        start: info.startStr,
                        end: info.endStr
                    }).then(function(result) {
                        if (result && result.success) {
                            calendar.addEvent({
                                id: result.id,
                                title: title,
                                start: info.startStr,
                                end: info.endStr
                            });
                        } else {
                            alert('Failed to create event: ' + (result ? result.error : 'Unknown error'));
                        }
                    }).guardedCatch(function(error) {
                        alert('Error creating event: ' + error);
                    });
                }
                calendar.unselect();
            },
            eventClick: function(info) {
                // 用户点击了事件，弹出编辑/删除对话框
                if (confirm('Do you want to delete this event?')) {
                    ajax.jsonRpc('/production/calendar/delete', 'call', {
                        id: info.event.id
                    }).then(function(result) {
                        if (result && result.success) {
                            info.event.remove();
                        } else {
                            alert('Failed to delete event: ' + (result ? result.error : 'Unknown error'));
                        }
                    }).guardedCatch(function(error) {
                        alert('Error deleting event: ' + error);
                    });
                }
            },
            eventDrop: function(info) {
                // 用户拖动了事件，更新事件时间
                ajax.jsonRpc('/production/calendar/update', 'call', {
                    id: info.event.id,
                    title: info.event.title,
                    start: info.event.startStr,
                    end: info.event.endStr
                }).then(function(result) {
                    if (!result || !result.success) {
                        info.revert();
                        alert('Failed to update event: ' + (result ? result.error : 'Unknown error'));
                    }
                }).guardedCatch(function(error) {
                    info.revert();
                    alert('Error updating event: ' + error);
                });
            },
            eventResize: function(info) {
                // 用户调整了事件大小，更新事件时间
                ajax.jsonRpc('/production/calendar/update', 'call', {
                    id: info.event.id,
                    title: info.event.title,
                    start: info.event.startStr,
                    end: info.event.endStr
                }).then(function(result) {
                    if (!result || !result.success) {
                        info.revert();
                        alert('Failed to update event: ' + (result ? result.error : 'Unknown error'));
                    }
                }).guardedCatch(function(error) {
                    info.revert();
                    alert('Error updating event: ' + error);
                });
            }
        });
        
        calendar.render();
        
        // 创建事件按钮
        $('#create-event').on('click', function() {
            const now = new Date();
            const tomorrow = new Date();
            tomorrow.setDate(now.getDate() + 1);
            
            const title = prompt('Please enter a title for the production event:');
            if (title) {
                // 创建新事件
                ajax.jsonRpc('/production/calendar/create', 'call', {
                    title: title,
                    start: now.toISOString(),
                    end: tomorrow.toISOString()
                }).then(function(result) {
                    if (result && result.success) {
                        calendar.addEvent({
                            id: result.id,
                            title: title,
                            start: now,
                            end: tomorrow
                        });
                    } else {
                        alert('Failed to create event: ' + (result ? result.error : 'Unknown error'));
                    }
                }).guardedCatch(function(error) {
                    alert('Error creating event: ' + error);
                });
            }
        });
    });
}); 
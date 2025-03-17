# -*- coding: utf-8 -*-
from odoo import http
from odoo.http import request, Response


class ProductionCalendar(http.Controller):
    @http.route('/production/calendar', type='http', auth='user')
    def production_calendar(self, **kw):
        """Return the calendar page that will be embedded in the iframe"""
        html_content = '''
<!DOCTYPE html>
<html>
<head>
    <meta charset='utf-8' />
    <link href="https://cdn.jsdelivr.net/npm/@fullcalendar/core/main.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid/main.css" rel="stylesheet" />
    <link href="https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid/main.css" rel="stylesheet" />
    <script src="https://cdn.jsdelivr.net/npm/@fullcalendar/core/main.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@fullcalendar/daygrid/main.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@fullcalendar/timegrid/main.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/@fullcalendar/interaction/main.js"></script>
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
        }
        #calendar {
            height: 100vh;
            padding: 10px;
        }
    </style>
</head>
<body>
    <div id='calendar'></div>
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            var calendarEl = document.getElementById('calendar');
            var calendar = new FullCalendar.Calendar(calendarEl, {
                plugins: ['dayGrid', 'timeGrid', 'interaction'],
                header: {
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                },
                defaultView: 'dayGridMonth',
                editable: true,
                selectable: true,
                selectMirror: true,
                events: '/production/calendar/data',
                select: function(info) {
                    var title = prompt('Event Title:');
                    if (title) {
                        fetch('/production/calendar/create', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                title: title,
                                start: info.start.toISOString(),
                                end: info.end.toISOString()
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                calendar.addEvent({
                                    id: data.id,
                                    title: title,
                                    start: info.start,
                                    end: info.end
                                });
                            }
                        });
                    }
                    calendar.unselect();
                },
                eventDrop: function(info) {
                    fetch('/production/calendar/update', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            id: info.event.id,
                            title: info.event.title,
                            start: info.event.start.toISOString(),
                            end: info.event.end.toISOString()
                        })
                    });
                },
                eventClick: function(info) {
                    if (confirm('Delete this event?')) {
                        fetch('/production/calendar/delete', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                id: info.event.id
                            })
                        })
                        .then(response => response.json())
                        .then(data => {
                            if (data.success) {
                                info.event.remove();
                            }
                        });
                    }
                }
            });
            calendar.render();
        });
    </script>
</body>
</html>
        '''
        return Response(html_content, content_type='text/html')
    
    @http.route('/production/calendar/data', type='json', auth='user')
    def get_calendar_data(self, **kw):
        """获取日历数据的API"""
        Production = request.env['rich_production.production']
        productions = Production.search([])
        
        events = []
        for prod in productions:
            if prod.start_date and prod.stop_date:
                events.append({
                    'id': prod.id,
                    'title': prod.name,
                    'start': prod.start_date.isoformat(),
                    'end': prod.stop_date.isoformat(),
                    'duration': prod.duration,
                })
        
        return events
    
    @http.route('/production/calendar/create', type='json', auth='user')
    def create_event(self, **kw):
        """创建新的生产记录"""
        Production = request.env['rich_production.production']
        
        try:
            new_prod = Production.create({
                'name': kw.get('title'),
                'start_date': kw.get('start'),
                'stop_date': kw.get('end'),
            })
            return {'success': True, 'id': new_prod.id}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @http.route('/production/calendar/update', type='json', auth='user')
    def update_event(self, **kw):
        """更新生产记录"""
        Production = request.env['rich_production.production']
        
        try:
            prod = Production.browse(int(kw.get('id')))
            prod.write({
                'name': kw.get('title'),
                'start_date': kw.get('start'),
                'stop_date': kw.get('end'),
            })
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
    
    @http.route('/production/calendar/delete', type='json', auth='user')
    def delete_event(self, **kw):
        """删除生产记录"""
        Production = request.env['rich_production.production']
        
        try:
            prod = Production.browse(int(kw.get('id')))
            prod.unlink()
            return {'success': True}
        except Exception as e:
            return {'success': False, 'error': str(e)}
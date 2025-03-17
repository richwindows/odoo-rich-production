/** @odoo-module */

import { registry } from "@web/core/registry";
import { CalendarController } from "@web/views/calendar/calendar_controller";
import { CalendarRenderer } from "@web/views/calendar/calendar_renderer";
import { CalendarModel } from "@web/views/calendar/calendar_model";
import { CalendarView } from "@web/views/calendar/calendar_view";

export class RichProductionCalendarController extends CalendarController {}
export class RichProductionCalendarRenderer extends CalendarRenderer {}
export class RichProductionCalendarModel extends CalendarModel {}

export const RichProductionCalendarView = {
    ...CalendarView,
    Controller: RichProductionCalendarController,
    Renderer: RichProductionCalendarRenderer,
    Model: RichProductionCalendarModel,
};

registry.category("views").add("rich_production_calendar", RichProductionCalendarView); 
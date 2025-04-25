odoo.define('rich_custom.xo_pp_ox_pp_window', function (require) {
    "use strict";

    var abstractWindow = require('rich_custom.abstract_window');

    var XO_PP_OX_PP_Window = abstractWindow.extend({
        init: function() {
            this._super.apply(this, arguments);
            this.windowType = 'XO-PP';
        },

        calculateDimensions: function(width, height, frameType, isTempered, glassType, grid, fixedHeight) {
            this.width = parseFloat(width);
            this.height = parseFloat(height);
            this.fixedHeight = parseFloat(fixedHeight || 0); // Fixed height for PP portion
            this.frameType = frameType;
            this.isTempered = isTempered;
            this.glassType = glassType;
            this.grid = grid;

            // Convert inches to mm if necessary
            if (this.units === 'inches') {
                this.width = this.width * 25.4;
                this.height = this.height * 25.4;
                this.fixedHeight = this.fixedHeight * 25.4;
            }

            this._calculateFrameDimensions();
            this._calculateSashDimensions();
            this._calculateScreenDimensions();
            this._calculateGlassDimensions();
            this._calculateMullionDimensions();
            this._calculatePartsDimensions();
            this._calculateGridDimensions();

            return {
                width: this.width,
                height: this.height,
                fixedHeight: this.fixedHeight,
                frameWidth: this.frameWidth,
                frameHeight: this.frameHeight,
                sashXWidth: this.sashXWidth,
                sashXHeight: this.sashXHeight, 
                sashOWidth: this.sashOWidth,
                sashOHeight: this.sashOHeight,
                screenWidth: this.screenWidth,
                screenHeight: this.screenHeight,
                glassTopWidth: this.glassTopWidth,
                glassTopHeight: this.glassTopHeight,
                glassFixedWidth: this.glassFixedWidth,
                glassFixedHeight: this.glassFixedHeight,
                glassSlidingWidth: this.glassSlidingWidth,
                glassSlidingHeight: this.glassSlidingHeight,
                mullionVertical: this.mullionVertical,
                mullionHorizontal: this.mullionHorizontal,
                mullionVerticalA: this.mullionVerticalA,
                handleA: this.handleA,
                track: this.track,
                coverWidth: this.coverWidth,
                coverHeight: this.coverHeight,
                bigMullion: this.bigMullion,
                bigMullion2: this.bigMullion2,
                slop: this.slop,
                gridLightCount: this.gridLightCount,
                gridConfigTop: this.gridConfigTop,
                gridConfigMiddle: this.gridConfigMiddle,
                gridConfigBottom: this.gridConfigBottom
            };
        },

        _calculateFrameDimensions: function() {
            // Base frame calculations
            this.frameWidth = this.width;
            this.frameHeight = this.height;
            
            // Frame type specific adjustments
            if (this.frameType === 'Nailon') {
                // Nailon frame type calculations
                this.frameOffset = 19.05; // 3/4"
                this.frameWidth = this.width + 3 * 2;
                this.frameHeight = this.height + 3 * 2;
            } else if (this.frameType === 'Retrofit') {
                // Retrofit frame type calculations
                this.frameOffset = 31.75; // 1-1/4"
                this.frameWidth = this.width + 3 * 2;
                this.frameHeight = this.height + 3 * 2;
            } else if (this.frameType === 'Block' || this.frameType === 'Block-slop') {
                // Block frame type calculations
                this.frameOffset = 0;
                this.frameWidth = this.width + 3 * 2;
                this.frameHeight = this.height + 3 * 2;
            }
        },

        _calculateSashDimensions: function() {
            // Calculate sash dimensions for XO part (lower section)
            if (this.frameType === 'Nailon') {
                // Sliding sash (X)
                this.sashXWidth = this.width / 2 - 14.5 - 15 + 1;
                this.sashXHeight = this.height - this.fixedHeight - 6 - 46 - 15 - 2 - 1;
                
                // Fixed sash (O)
                this.sashOWidth = this.sashXWidth;
                this.sashOHeight = this.sashXHeight;
            } else {
                // For other frame types (Retrofit, Block, Block-slop)
                // Sliding sash (X)
                this.sashXWidth = this.width / 2 - 14.5 + 1;
                this.sashXHeight = this.height - this.fixedHeight - 6 - 46 - 2 - 1;
                
                // Fixed sash (O)
                this.sashOWidth = this.sashXWidth;
                this.sashOHeight = this.sashXHeight;
            }
        },

        _calculateScreenDimensions: function() {
            // Screen is typically for the sliding section
            if (this.frameType === 'Nailon') {
                this.screenWidth = this.width / 2 - 75 - 15 - 2;
                this.screenHeight = this.height - this.fixedHeight - 6 - 87 - 15 - 4;
            } else {
                this.screenWidth = this.width / 2 - 75 - 2;
                this.screenHeight = this.height - this.fixedHeight - 6 - 87 - 4;
            }
        },

        _calculateGlassDimensions: function() {
            // Calculate glass dimensions for all sections
            if (this.frameType === 'Nailon') {
                // Sliding section (X)
                this.glassSlidingWidth = this.width / 2 - 77 - 15;
                this.glassSlidingHeight = this.height - this.fixedHeight - 6 - 109 - 15 - 3 - 2;
                
                // Fixed section (O)
                this.glassFixedWidth = this.width / 2 - 44 - 15;
                this.glassFixedHeight = this.height - this.fixedHeight - 6 - 47 - 15 - 2;
                
                // Top fixed section (PP)
                this.glassTopWidth = this.width / 2 - 6 - 20.5 * 2 - 3 * 2 - 15;
                this.glassTopHeight = this.fixedHeight - 6 - 20.5 * 2 - 3 * 2 - 15 - 2;
            } else {
                // Sliding section (X)
                this.glassSlidingWidth = this.width / 2 - 77;
                this.glassSlidingHeight = this.height - this.fixedHeight - 6 - 109 - 3 - 2;
                
                // Fixed section (O)
                this.glassFixedWidth = this.width / 2 - 44;
                this.glassFixedHeight = this.height - this.fixedHeight - 6 - 47 - 2;
                
                // Top fixed section (PP)
                this.glassTopWidth = this.width / 2 - 6 - 20.5 * 2 - 3 * 2;
                this.glassTopHeight = this.fixedHeight - 6 - 20.5 * 2 - 3 * 2 - 2;
            }
        },

        _calculateMullionDimensions: function() {
            // Calculate mullion dimensions
            if (this.frameType === 'Nailon') {
                this.mullionVertical = this.height - this.fixedHeight - 6 - 36 - 15;
                this.mullionHorizontal = this.width - 14 * 2 - 15 * 2 - 3 - 20;
            } else {
                this.mullionVertical = this.height - this.fixedHeight - 6 - 36;
                this.mullionHorizontal = this.width - 14 * 2 - 3 - 20;
            }
        },

        _calculatePartsDimensions: function() {
            // Calculate dimensions for additional parts
            if (this.frameType === 'Nailon') {
                this.mullionVerticalA = this.mullionVertical - 2 * 25.4;
                this.handleA = (this.height - this.fixedHeight - 6 - 46 - 15) / 2 + 4 * 25.4;
                this.track = this.width - 14 * 2 - 15 * 2 - 3 - 20;
                this.coverWidth = this.width / 2 - 6 - 14 * 2 - 15 - 3 - 13;
                this.coverHeight = this.fixedHeight - 6 - 14 * 2 - 15 - 22 * 2;
                this.bigMullion = this.width - 14 * 2 - 15 * 2 - 2 + 1.5;
                this.bigMullion2 = this.fixedHeight - 6 - 14 * 2 - 15 + 1.5;
            } else {
                this.mullionVerticalA = this.mullionVertical - 2 * 25.4;
                this.handleA = (this.height - this.fixedHeight - 6 - 46) / 2 + 4 * 25.4;
                this.track = this.width - 14 * 2 - 3 - 20;
                this.coverWidth = this.width / 2 - 6 - 14 * 2 - 3 - 13;
                this.coverHeight = this.fixedHeight - 6 - 14 * 2 - 22 * 2;
                this.bigMullion = this.width - 14 * 2 - 2 + 1.5;
                this.bigMullion2 = this.fixedHeight - 6 - 14 * 2 + 1.5;
            }
            
            // Calculate slop for Block-slop frame type
            if (this.frameType === 'Block-slop') {
                this.slop = this.width - 10;
            }
        },

        _calculateGridDimensions: function() {
            if (!this.grid || this.grid === 'None') {
                this.gridLightCount = 0;
                this.gridConfigTop = 'No Grid';
                this.gridConfigMiddle = 'No Grid';
                this.gridConfigBottom = 'No Grid';
                return;
            }

            // Calculate grid dimensions for sliding section (X)
            let sashGridWidth = this.glassSlidingWidth - 18 - 2;
            let sashGridHeight = this.glassSlidingHeight - 18 - 2;
            
            // Calculate grid dimensions for fixed section (O)
            let fixedGridWidth = this.glassFixedWidth - 18 - 2;
            let fixedGridHeight = this.glassFixedHeight - 18 - 2;
            
            // Calculate grid dimensions for top fixed section (PP)
            let fixedGrid2Width = this.glassTopWidth - 18 - 2;
            let fixedGrid2Height = this.glassTopHeight - 18 - 2;
            
            // Determine grid configuration
            let verticalDividers, horizontalDividers;
            
            // Grid configuration based on window width
            if (this.width <= 914.4) { // 36 inches
                verticalDividers = 1;
            } else if (this.width <= 1524) { // 60 inches
                verticalDividers = 2;
            } else {
                verticalDividers = 3;
            }
            
            // Grid configuration based on window height
            if (this.height / 2 <= 609.6) { // 24 inches
                horizontalDividers = 1;
            } else {
                horizontalDividers = 2;
            }
            
            // Grid light count calculation based on grid type
            const gridLightsPerSection = (verticalDividers + 1) * (horizontalDividers + 1);
            
            // Set grid configuration based on grid type
            if (this.grid === 'Standard') {
                this.gridLightCount = gridLightsPerSection * 3; // For all three sections
                this.gridConfigTop = `${horizontalDividers + 1}x${verticalDividers + 1}`;
                this.gridConfigMiddle = this.gridConfigTop;
                this.gridConfigBottom = this.gridConfigTop;
            } else if (this.grid === 'Marginal') {
                this.gridLightCount = gridLightsPerSection * 3 * 2; // Doubled for marginal grid
                this.gridConfigTop = `${horizontalDividers + 1}x${verticalDividers + 1} Marginal`;
                this.gridConfigMiddle = this.gridConfigTop;
                this.gridConfigBottom = this.gridConfigTop;
            } else if (this.grid === 'Perimeter') {
                this.gridLightCount = gridLightsPerSection * 3; // For all three sections
                this.gridConfigTop = `${horizontalDividers + 1}x${verticalDividers + 1} Perimeter`;
                this.gridConfigMiddle = this.gridConfigTop;
                this.gridConfigBottom = this.gridConfigTop;
            }
        }
    });

    return XO_PP_OX_PP_Window;
}); 
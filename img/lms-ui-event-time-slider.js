/*
 * LMS version 1.11-git
 *
 *  (C) Copyright 2001-2018 LMS Developers
 *
 *  Please, see the doc/AUTHORS for more information about authors!
 *
 *  This program is free software; you can redistribute it and/or modify
 *  it under the terms of the GNU General Public License Version 2 as
 *  published by the Free Software Foundation.
 *
 *  This program is distributed in the hope that it will be useful,
 *  but WITHOUT ANY WARRANTY; without even the implied warranty of
 *  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *  GNU General Public License for more details.
 *
 *  You should have received a copy of the GNU General Public License
 *  along with this program; if not, write to the Free Software
 *  Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA 02111-1307,
 *  USA.
 *
 *  $Id$
 */

function eventTimeSlider(options) {
	if (typeof(options) != 'object') {
		return null;
	}

	var valid = true;
	$.each([ 'start-selector', 'end-selector', 'slider-selector', 'step', 'max' ], function(index, value) {
		if (!options.hasOwnProperty(value) || !$(options[value]).length) {
			valid = false;
		}
	});
	if (!valid) {
		return null;
	}

	var start_input = $(options['start-selector']);
	var end_input = $(options['end-selector']);
	var _slider = null;
	var whole_days = false;

	function updateRange(values) {
		var startdt = new Date(start_input.datetimepicker('getValue'));
		var enddt = new Date(end_input.datetimepicker('getValue'));
		if (startdt == null || enddt == null) {
			return;
		}

		var days = 1;
		if (startdt.getFullYear() != enddt.getFullYear() ||
			startdt.getMonth() != enddt.getMonth() ||
			startdt.getDay() != enddt.getDay()) {
			startdt.setHours(0);
			startdt.setMinutes(0);
			startdt.setSeconds(0);
			enddt.setHours(0);
			enddt.setMinutes(0);
			enddt.setSeconds(0);
			days = Math.round((enddt - startdt) / 1000 / 86400) + 1;
		}
		var range;
		if (values === undefined) {
			values = $(_slider).dragslider('values');
		}
		range = values[1] - values[0];

		$(_slider).find('.ui-slider-range')
			.text((whole_days ? lmsMessages.eventWholeDays.replace('$a', days) :
				(days > 1 ? days + ' x ' : '') + sprintf("%02d:%02d", Math.floor(range / 60), (range % 60))));
	}

	function setDateTimePickerStartRestrictions() {
		var startdt = start_input.datetimepicker('getValue');
		var enddt = end_input.datetimepicker('getValue');
		if (enddt === null) {
			return;
		}
		if (startdt > enddt) {
			start_input.datetimepicker('setOptions', {
				value: new Date(enddt)
			});
		}
	}

	function setDateTimePickerEndRestrictions() {
		var startdt = start_input.datetimepicker('getValue');
		var enddt = end_input.datetimepicker('getValue');
		if (startdt === null) {
			return;
		}
		if (enddt < startdt) {
			end_input.datetimepicker('setOptions', {
				value: new Date(startdt)
			});
		}
		end_input.datetimepicker('setOptions', {
			minDate: new Date(startdt)
		});
	}

	function inputToSlider(input) {
		var time = input.datetimepicker('getValue');
		if (time) {
			return time.getHours() * 60 + time.getMinutes();
		} else {
			return 0;
		}
	}

	function sliderToInput(value, input) {
		var time = input.datetimepicker('getValue');
		time.setHours(Math.floor(value / 60))
		time.setMinutes(value % 60);
		input.datetimepicker({
			value: time
		});
	}

	function toggleSliderDrag(handleIndex) {
		if (handleIndex & 1) {
			start_input.toggleClass('lms-ui-dragslider-slave');
		}
		if (handleIndex & 2) {
			end_input.toggleClass('lms-ui-dragslider-slave');
		}
	}

	$(options['slider-selector']).dragslider({
		range: true,
		min: 0,
		max: options.max,
		step: options.step,
		rangeDrag: true,
		create: function() {
			_slider = this;
		},
		values: [
			inputToSlider(start_input),
			inputToSlider(end_input)
		],
		slide: function (e, ui) {
			sliderToInput(ui.values[0], start_input);
			sliderToInput(ui.values[1], end_input);
			switch (ui.handleIndex) {
				case 0:
					setDateTimePickerEndRestrictions();
					break;
				case 1:
					setDateTimePickerStartRestrictions();
					break;
				default:
					setDateTimePickerStartRestrictions();
					setDateTimePickerEndRestrictions();
			}
			updateRange(ui.values);
		},
		start: function (e, ui) {
			toggleSliderDrag(ui.handleIndex);
		},
		stop: function (e, ui) {
			toggleSliderDrag(ui.handleIndex);
		}
	});

	$(_slider).find('.ui-slider-handle:last-child').focus();

	function RoundTime(item, type) {
		item.setOptions({
			value: new Date(Math.round(item.getValue().getTime() / 1000 / lmsSettings.eventTimeStep / 60) *
				lmsSettings.eventTimeStep * 60 * 1000)
		});
	}

	start_input.datetimepicker('setOptions', {
		onChangeDateTime: function() {
			RoundTime(this);
			var options = [];
			if (whole_days) {
				options = [ 0, 1440 ];
			} else {
				options = [
					inputToSlider(start_input),
					inputToSlider(end_input)
				];
			}
			$(_slider).dragslider('values', options);
			setDateTimePickerEndRestrictions();
			updateRange();
		},
	});
	end_input.datetimepicker('setOptions', {
		onChangeDateTime: function() {
			RoundTime(this);
			var options = [];
			if (whole_days) {
				options = [ 0, 1440 ];
			} else {
				options = [
					inputToSlider(start_input),
					inputToSlider(end_input)
				];
			}
			$(_slider).dragslider('values', options);
			setDateTimePickerStartRestrictions();
			updateRange();
		},
	});

	setDateTimePickerStartRestrictions();
	setDateTimePickerEndRestrictions();
	updateRange();

	function dateToString(dt) {
		return sprintf("%04d/%02d/%02d",
			dt.getFullYear(),
			dt.getMonth() + 1,
			dt.getDate()
		);
	}

	function dateTimeToString(dt) {
		return sprintf("%04d/%02d/%02d %02d:%02d",
			dt.getFullYear(),
			dt.getMonth() + 1,
			dt.getDate(),
			dt.getHours(),
			dt.getMinutes()
		);
	}
	$('.lms-ui-event-whole-days').change(function () {
		var startdt = start_input.datetimepicker('getValue');
		var enddt = end_input.datetimepicker('getValue');

		if ($(this).prop('checked')) {
			$(_slider).dragslider('disable');
			start_input.datetimepicker('setOptions', {
				timepicker: false,
				format: 'Y/m/d'
			});
			if (startdt !== null) {
				start_input.val(dateToString(startdt));
			}
			end_input.datetimepicker('setOptions', {
				timepicker: false,
				format: 'Y/m/d'
			});
			if (enddt !== null) {
				end_input.val(dateToString(enddt));
			}
			whole_days = true;
			$(_slider).dragslider('values', [ 0, 1440 ]);
		} else {
			$(_slider).dragslider('enable');
			start_input.datetimepicker('setOptions', {
				timepicker: true,
				format: 'Y/m/d H:i'
			});
			if (startdt !== null) {
				start_input.val(dateTimeToString(startdt));
			}
			end_input.datetimepicker('setOptions', {
				timepicker: true,
				format: 'Y/m/d H:i'
			});
			if (enddt !== null) {
				end_input.val(dateTimeToString(enddt));
			}
			whole_days = false;
			var values = [ 0, 1440 ];
			if (startdt !== null) {
				values[0] = startdt.getHours() * 60 + startdt.getMinutes();
			}
			if (enddt !== null) {
				values[1] = enddt.getHours() * 60 + enddt.getMinutes();
			}
			$(_slider).dragslider('values', values);
		}
		updateRange();
	}).change();
}

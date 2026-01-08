import 'package:flutter/material.dart';
import 'package:table_calendar/table_calendar.dart';
import 'package:wiz/constants/app_styles.dart';

class DateTimeScreen extends StatefulWidget {
  const DateTimeScreen({super.key});

  @override
  State<DateTimeScreen> createState() => _DateTimeScreenState();
}

class _DateTimeScreenState extends State<DateTimeScreen> {
  DateTime _focusedDay = DateTime.now();
  DateTime? _startDate;
  DateTime? _endDate;
  TimeOfDay _startTime = const TimeOfDay(hour: 21, minute: 0);
  TimeOfDay _endTime = const TimeOfDay(hour: 20, minute: 0);

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: AppStyles.background(context),
      appBar: AppBar(
        leading: IconButton(icon: const Icon(Icons.arrow_back), onPressed: () => Navigator.pop(context)),
        title: Text('Select Date and Time', style: AppStyles.h2(context)),
        centerTitle: true,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            _buildCalendar(),
            const SizedBox(height: 24),
            _buildTimePickers(),
            const SizedBox(height: 24),
            _buildDurationAndSetButton(),
          ],
        ),
      ),
    );
  }

  Widget _buildCalendar() {
    return Card(
      color: AppStyles.surface(context),
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
      child: TableCalendar(
        firstDay: DateTime.now(),
        lastDay: DateTime.now().add(const Duration(days: 365)),
        focusedDay: _focusedDay,
        headerStyle: HeaderStyle(
          titleCentered: true,
          formatButtonVisible: false,
          titleTextStyle: AppStyles.h3(context),
          leftChevronIcon: const Icon(Icons.chevron_left),
          rightChevronIcon: const Icon(Icons.chevron_right),
        ),
        calendarStyle: CalendarStyle(
          todayDecoration: BoxDecoration(color: AppStyles.primary.withOpacity(0.3), shape: BoxShape.circle),
          selectedDecoration: const BoxDecoration(color: AppStyles.primary, shape: BoxShape.circle),
          weekendTextStyle: AppStyles.body(context),
          defaultTextStyle: AppStyles.body(context),
        ),
        selectedDayPredicate: (day) => isSameDay(_startDate, day) || isSameDay(_endDate, day),
        onDaySelected: (selectedDay, focusedDay) {
          setState(() {
            if (_startDate == null || (_startDate != null && _endDate != null)) {
              _startDate = selectedDay;
              _endDate = null;
            } else {
              _endDate = selectedDay;
            }
            _focusedDay = focusedDay;
          });
        },
      ),
    );
  }

  Widget _buildTimePickers() {
    return Row(
      children: [
        Expanded(child: _timeField('From', _startTime, (t) => _startTime = t)),
        const SizedBox(width: 16),
        Expanded(child: _timeField('To', _endTime, (t) => _endTime = t)),
      ],
    );
  }

  Widget _timeField(String label, TimeOfDay time, Function(TimeOfDay) onChanged) {
    return GestureDetector(
      onTap: () async {
        final t = await showTimePicker(context: context, initialTime: time);
        if (t != null) setState(() => onChanged(t));
      },
      child: Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(color: AppStyles.surface(context), borderRadius: BorderRadius.circular(12)),
        child: Row(
          children: [
            Text(label, style: AppStyles.caption(context)),
            const Spacer(),
            Text(time.format(context), style: AppStyles.body(context)),
            const Icon(Icons.keyboard_arrow_down),
          ],
        ),
      ),
    );
  }

  Widget _buildDurationAndSetButton() {
    String durationText = 'Duration: Not selected';

    if (_startDate != null && _endDate != null) {
      // Combine dates with times
      final startDateTime = DateTime(
        _startDate!.year,
        _startDate!.month,
        _startDate!.day,
        _startTime.hour,
        _startTime.minute,
      );

      final endDateTime = DateTime(_endDate!.year, _endDate!.month, _endDate!.day, _endTime.hour, _endTime.minute);

      final difference = endDateTime.difference(startDateTime);

      if (difference.inDays >= 1) {
        final days = difference.inDays;
        durationText = 'Duration: $days day${days == 1 ? '' : 's'}';
      } else if (difference.inHours > 0) {
        final hours = difference.inHours;
        durationText = 'Duration: $hours hour${hours == 1 ? '' : 's'}';
      } else if (difference.inMinutes > 0) {
        final minutes = difference.inMinutes;
        durationText = 'Duration: $minutes minute${minutes == 1 ? '' : 's'}';
      } else {
        durationText = 'Duration: Same time';
      }
    } else if (_startDate != null) {
      durationText = 'Duration: Start date only';
    }

    return Column(
      children: [
        Text(durationText, style: AppStyles.caption(context)),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            style: AppStyles.primaryButtonStyle(context),
            onPressed: () {
              if (_startDate == null) return;

              final formattedStart =
                  '${_startTime.format(context)}, ${_startDate!.day}/${_startDate!.month}/${_startDate!.year}';
              final formattedEnd = _endDate != null
                  ? '${_endTime.format(context)}, ${_endDate!.day}/${_endDate!.month}/${_endDate!.year}'
                  : formattedStart; // fallback if no end

              final result = {'datetime': '$formattedStart - $formattedEnd'};

              Navigator.pop(context, result);
            },
            child: Text('Set Time', style: AppStyles.button),
          ),
        ),
      ],
    );
  }
}

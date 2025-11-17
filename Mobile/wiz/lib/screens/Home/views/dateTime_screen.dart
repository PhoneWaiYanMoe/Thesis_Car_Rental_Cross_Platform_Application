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
        decoration: BoxDecoration(
          color: AppStyles.surface(context),
          borderRadius: BorderRadius.circular(12),
        ),
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
    final days = _startDate != null && _endDate != null
        ? _endDate!.difference(_startDate!).inDays + 1
        : 0;

    return Column(
      children: [
        Text('Duration: ${days} days', style: AppStyles.caption(context)),
        const SizedBox(height: 16),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            style: AppStyles.primaryButtonStyle(context),
            onPressed: () {
              final result = {
                'start': '${_startTime.format(context)}, ${_startDate?.day}/${_startDate?.month}',
                'end': '${_endTime.format(context)}, ${_endDate?.day}/${_endDate?.month}',
              };
              Navigator.pop(context, result);
            },
            child: Text('Set Time', style: AppStyles.button),
          ),
        ),
      ],
    );
  }
}
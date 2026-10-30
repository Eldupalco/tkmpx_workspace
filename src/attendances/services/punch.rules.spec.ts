import { afternoonStart, hoursWorked, nextPunch, punchMetrics, punchStatus } from './punch.rules.js';

// Rules read wall-clock times in APP_TIMEZONE; UTC keeps the fixtures readable
process.env.APP_TIMEZONE = 'UTC';

const at = (time: string) => new Date(`2026-10-30T${time}:00Z`);
const standardShift = {
  startTime: '09:00',
  endTime: '17:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  graceMinutes: 5,
};

describe('afternoonStart', () => {
  it('moves a PM In during the lunch break to the break end', () => {
    expect(afternoonStart(at('12:18'), standardShift)).toEqual(at('13:00'));
  });

  it('drops the seconds of an early PM In', () => {
    expect(afternoonStart(new Date('2026-10-30T12:18:40Z'), standardShift)).toEqual(at('13:00'));
  });

  it('keeps a PM In at or after the break end', () => {
    expect(afternoonStart(at('13:00'), standardShift)).toEqual(at('13:00'));
    expect(afternoonStart(at('13:20'), standardShift)).toEqual(at('13:20'));
  });

  it('uses the default 12:00-13:00 break when there is no schedule', () => {
    expect(afternoonStart(at('12:30'), null)).toEqual(at('13:00'));
  });

  it('does not move anything for a shift without a break', () => {
    const noBreak = { ...standardShift, breakStart: null, breakEnd: null };
    expect(afternoonStart(at('12:30'), noBreak)).toEqual(at('12:30'));
  });
});

describe('hoursWorked', () => {
  it('does not count lunch break time after an early PM In', () => {
    // 12:18 -> 17:00 would be 4.7 h; counted from 13:00 it is 4 h
    expect(hoursWorked({ pmIn: at('12:18'), pmOut: at('17:00') }, standardShift)).toBe(4);
  });

  it('adds both halves of a full day', () => {
    const record = { amIn: at('09:00'), amOut: at('12:00'), pmIn: at('13:00'), pmOut: at('17:00') };
    expect(hoursWorked(record, standardShift)).toBe(7);
  });

  it('counts nothing for an open afternoon session', () => {
    expect(hoursWorked({ pmIn: at('13:00') }, standardShift)).toBe(0);
  });
});

describe('nextPunch', () => {
  it('starts with Morning In before the break', () => {
    expect(nextPunch(null, '08:55', standardShift)).toBe('amIn');
  });

  it('skips the morning once the break has started (half day)', () => {
    expect(nextPunch(null, '12:13', standardShift)).toBe('pmIn');
  });

  it('follows AM In, AM Out, PM In, PM Out, then completes', () => {
    expect(nextPunch({ amIn: at('09:00') }, '10:00', standardShift)).toBe('amOut');
    expect(nextPunch({ amIn: at('09:00'), amOut: at('12:00') }, '12:30', standardShift)).toBe('pmIn');
    expect(nextPunch({ pmIn: at('13:00') }, '14:00', standardShift)).toBe('pmOut');
    expect(
      nextPunch({ amIn: at('09:00'), amOut: at('12:00'), pmIn: at('13:00'), pmOut: at('17:00') }, '17:01', standardShift),
    ).toBeNull();
  });
});

describe('punchMetrics and punchStatus', () => {
  it('treats arrivals within the grace period as on time', () => {
    expect(punchMetrics({ amIn: at('09:04') }, standardShift).lateMinutes).toBe(0);
  });

  it('counts the full delay once past the grace period', () => {
    expect(punchMetrics({ amIn: at('09:35') }, standardShift).lateMinutes).toBe(35);
  });

  it('does not mark an early PM In as late', () => {
    expect(punchMetrics({ pmIn: at('12:18') }, standardShift).lateMinutes).toBe(0);
  });

  it('marks an afternoon-only day as half_day and never overwrites leave', () => {
    expect(punchStatus({ pmIn: at('12:18') }, 0)).toBe('half_day');
    expect(punchStatus({ amIn: at('09:35') }, 35, 'on_leave')).toBe('on_leave');
  });
});

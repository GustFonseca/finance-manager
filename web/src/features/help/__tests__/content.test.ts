import { PROGRAMS } from '@/components/xp/programs';
import { HELP } from '../content';

describe('HELP content', () => {
  it.each(PROGRAMS.map((program) => [program.route]))('has a complete topic for %s', (route) => {
    const topic = HELP[route];
    expect(topic).toBeDefined();
    expect(topic.title.trim()).not.toBe('');
    expect(topic.summary.trim()).not.toBe('');
    expect(topic.howItWorks.length).toBeGreaterThan(0);
    expect(topic.howItWorks.every((line) => line.trim() !== '')).toBe(true);
    expect(topic.steps.length).toBeGreaterThan(0);
    expect(topic.steps.every((step) => step.title.trim() !== '' && step.text.trim() !== '')).toBe(true);
  });

  it('only describes known programs', () => {
    const routes = PROGRAMS.map((program) => program.route);
    expect(Object.keys(HELP).filter((route) => !routes.includes(route))).toEqual([]);
  });
});

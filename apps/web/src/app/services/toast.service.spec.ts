import { ToastService } from './toast.service';

describe('ToastService', () => {
  let service: ToastService;

  beforeEach(() => {
    jest.useFakeTimers();
    service = new ToastService();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('show', () => {
    it('should add a toast with default info type', () => {
      service.show('Hello');
      const toasts = service.toasts();
      expect(toasts).toHaveLength(1);
      expect(toasts[0].message).toBe('Hello');
      expect(toasts[0].type).toBe('info');
    });

    it('should add a toast with specified type', () => {
      service.show('Error!', 'error');
      expect(service.toasts()[0].type).toBe('error');
    });

    it('should assign incrementing IDs', () => {
      service.show('A');
      service.show('B');
      const toasts = service.toasts();
      expect(toasts[0].id).toBeLessThan(toasts[1].id);
    });

    it('should auto-dismiss after 4 seconds', () => {
      service.show('Temp');
      expect(service.toasts()).toHaveLength(1);
      jest.advanceTimersByTime(4000);
      expect(service.toasts()).toHaveLength(0);
    });
  });

  describe('convenience methods', () => {
    it('success should create a success toast', () => {
      service.success('Done!');
      expect(service.toasts()[0].type).toBe('success');
      expect(service.toasts()[0].message).toBe('Done!');
    });

    it('error should create an error toast', () => {
      service.error('Failed');
      expect(service.toasts()[0].type).toBe('error');
    });

    it('info should create an info toast', () => {
      service.info('FYI');
      expect(service.toasts()[0].type).toBe('info');
    });
  });

  describe('dismiss', () => {
    it('should remove a specific toast by id', () => {
      service.show('A');
      service.show('B');
      const idToRemove = service.toasts()[0].id;
      service.dismiss(idToRemove);

      const remaining = service.toasts();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].message).toBe('B');
    });

    it('should do nothing for non-existent id', () => {
      service.show('A');
      service.dismiss(999);
      expect(service.toasts()).toHaveLength(1);
    });
  });

  describe('multiple toasts', () => {
    it('should stack multiple toasts', () => {
      service.success('1');
      service.error('2');
      service.info('3');
      expect(service.toasts()).toHaveLength(3);
    });

    it('should independently auto-dismiss', () => {
      service.show('A');
      jest.advanceTimersByTime(2000);
      service.show('B');
      jest.advanceTimersByTime(2000); // A has been alive 4s, B only 2s
      expect(service.toasts()).toHaveLength(1);
      expect(service.toasts()[0].message).toBe('B');
      jest.advanceTimersByTime(2000); // B now at 4s
      expect(service.toasts()).toHaveLength(0);
    });
  });
});

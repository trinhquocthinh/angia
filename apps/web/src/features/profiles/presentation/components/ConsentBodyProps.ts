export type ConsentBodyProps = {
  name: string;
  basis: 'self' | 'guardian' | null;
  pending: boolean;
  message: string;
  error: string;
  setBasis: (basis: 'self' | 'guardian') => void;
  confirm: () => Promise<void>;
  onClose: () => void;
};

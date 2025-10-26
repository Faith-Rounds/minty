import { Container } from '../components/layout/Container';
import { useParams } from 'react-router-dom';

export function PayPage() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  
  return (
    <Container className="py-16">
      <h1 className="text-2xl font-bold mb-6">Pay Invoice</h1>
      <div className="card">
        <p className="text-gray-600">
          This is a placeholder for the pay page. Invoice ID: {invoiceId}
        </p>
      </div>
    </Container>
  );
}

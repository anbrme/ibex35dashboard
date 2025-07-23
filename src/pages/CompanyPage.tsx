import { useParams } from 'react-router-dom';

export function CompanyPage() {
  const { ticker } = useParams();

  return (
    <div>
      <h1>Company: {ticker}</h1>
    </div>
  );
}
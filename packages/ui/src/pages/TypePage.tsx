import { useParams } from 'react-router-dom';
import { useStore } from '../store';
import { TypeView } from '../components/Documentation/TypeView';

export function TypePage() {
  const { kind, name } = useParams<{ kind: string; name: string }>();
  const docs = useStore((state) => state.docs);

  const entry = docs.find((d) => d.kind === kind && d.name === name);

  if (!entry) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          Could not find documentation for {kind}/{name}
        </p>
      </div>
    );
  }

  return <TypeView entry={entry} />;
}

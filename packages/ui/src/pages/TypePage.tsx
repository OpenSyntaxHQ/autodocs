import { useParams } from 'react-router-dom';
import { useStore } from '../store';
import { TypeView } from '../components/Documentation/TypeView';

export function TypePage() {
  const { kind, id } = useParams<{ kind: string; id: string; slug?: string }>();
  const docs = useStore((state) => state.docs);
  const decodedId = id ? decodeURIComponent(id) : id;

  const entry =
    kind && decodedId ? docs.find((d) => d.id === decodedId && d.kind === kind) : undefined;

  if (!entry) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Not Found</h1>
        <p className="mt-2 text-muted-foreground">
          Could not find documentation for {kind ?? 'unknown'}/{decodedId ?? 'unknown'}
        </p>
      </div>
    );
  }

  return <TypeView entry={entry} />;
}

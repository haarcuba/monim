import { EditableName } from '@/EditableName';

interface Props {
    name: string;
    isOwner: boolean;
    onRename: (name: string) => void;
}

export function Name({ name, isOwner, onRename }: Props) {
    if (isOwner) {
        return <EditableName name={name} onChange={onRename} />;
    }
    return <div className="fastwatch-name">{name}</div>;
}

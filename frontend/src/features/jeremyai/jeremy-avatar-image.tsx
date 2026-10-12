import {AvatarImage} from "@/ui-components/ui/avatar";

interface Props {
    mode?: "serious" | "satire";
    alt?: string;
}

// Satire-Modus: Foto, seriöser Modus: Mönch-Maskottchen (auf den Kopf gezoomt)
export function JeremyAvatarImage({mode, alt = ""}: Props) {
    if (mode === "satire") {
        return <AvatarImage src="/JeremyPB.jpg" alt={alt}/>;
    }
    return (
        <AvatarImage
            src="/Avatar.png"
            alt={alt}
            className="origin-[56%_26%] scale-[2.2] object-cover"
        />
    );
}
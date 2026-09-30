import {Link} from "react-router";

export function FooterComponent(){
    return(
        <footer className="border-t p-6 text-center">
                <p className="text-sm text-muted-foreground"> © Finanzmönch - Ein Studentenprojekt an der Leibniz FH</p>

            <div className="mt-2 flex justify-center gap-4">
            <Link to="/impressum" className="text-sm text-muted-foreground hover:underline">
                Impressum
            </Link>

            <Link to="/datenschutz" className="text-sm text-muted-foreground hover:underline">
                Datenschutzerklärung
            </Link>
            </div>
        </footer>
    )
}
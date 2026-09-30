import {Link} from "react-router";

export function FooterComponent(){
    return(
        <footer className="border-t p-6 text-center">
                <p className="text-sm text-muted-foreground"> © Finanzmönch - Ein Studentenprojekt an der Leibniz FH</p>
            <Link to="/impressum" className="text-sm text-muted-foreground hover:underline">
                Impressum
            </Link>
        </footer>
    )
}
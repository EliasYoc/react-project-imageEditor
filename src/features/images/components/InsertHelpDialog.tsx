import { CircleQuestionMark } from "lucide-react";
import type { ReactNode } from "react";
import { Dialog } from "../../../components/ui/Dialog";
import styles from "./InsertHelpDialog.module.css";

export interface InsertHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** Enlace a otra web: se abre en una pestaña nueva, sin dejar el editor. */
const ExternalLink = ({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) => (
  <a
    className={styles.link}
    href={href}
    target="_blank"
    rel="noopener noreferrer"
  >
    {children}
  </a>
);

/** Un tipo de archivo: su título y cómo se usa o se consigue. */
const Section = ({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) => (
  <section aria-label={title}>
    <h3 className={styles.title}>{title}</h3>
    <p className={styles.text}>{children}</p>
  </section>
);

/**
 * Qué se puede insertar con «Insertar archivo» y cómo conseguir GIFs y
 * stickers. Se abre desde «¿Qué puedo insertar?», en el mismo menú.
 */
const InsertHelpDialog = ({ open, onOpenChange }: InsertHelpDialogProps) => (
  <Dialog
    open={open}
    onOpenChange={onOpenChange}
    title="¿Qué puedo insertar?"
    icon={CircleQuestionMark}
  >
    <div className={styles.sections}>
      <Section title="Imágenes (PNG, JPG, WebP…)">Se insertan quietas.</Section>
      <Section title="GIFs (.gif, y también WebP o PNG animados)">
        En Safari (iPhone y Mac) se ven quietos y algunos navegadores móviles no
        permiten insertarlos.
      </Section>
      <Section title="Stickers Lottie (.json)">
        Animaciones vectoriales, nítidas a cualquier tamaño. Hay gratis en{" "}
        <ExternalLink href="https://lottiefiles.com/free-animations">
          LottieFiles
        </ExternalLink>{" "}
        («Download» → «Lottie JSON»; puede pedir una cuenta gratuita) y en los{" "}
        <ExternalLink href="https://googlefonts.github.io/noto-emoji-animation/">
          emojis animados de Google (Noto)
        </ExternalLink>
        .
      </Section>
      <Section title="Stickers de Telegram (.tgs)">
        Son stickers Lottie comprimidos. Para conseguirlos, en Telegram busca un
        bot que se encargue de convertir los stickers animados a .tgs (algunos
        bots también convierten Stickers a .json). Descarga el archivo .tgs y en
        este editor lo puedes insertar.
      </Section>
    </div>
  </Dialog>
);

export default InsertHelpDialog;

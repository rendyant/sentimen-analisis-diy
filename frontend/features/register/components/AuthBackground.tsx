import styles from "./AuthBackground.module.css";

export default function AuthBackground({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className={styles.page}>
        <div className={`${styles.bg} ${styles.tugu}`} aria-hidden="true"/>
        <div className={`${styles.bg} ${styles.pendopo}`} aria-hidden="true" />

        <main className={styles.content}>{children}</main>
        </div>
    );
}

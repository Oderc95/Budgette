/**
 * Identifiants côté client.
 *
 * `crypto.randomUUID` évite les collisions que produirait un horodatage quand
 * deux éléments sont créés dans la même milliseconde. La solution de repli
 * couvre les contextes non sécurisés, où l'API n'est pas exposée.
 */
export function newId(prefix: string): string {
  const uuid =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : Array.from({ length: 4 }, () => Math.floor(Math.random() * 0xffff).toString(16)).join('')
  return `${prefix}_${uuid.replace(/-/g, '').slice(0, 12)}`
}

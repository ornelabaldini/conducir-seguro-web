/**
 * Repository Pattern: Abstracción de Almacenamiento Local
 * Aplicando SRP: Única responsabilidad de leer/escribir datos estructurados.
 */
export class StorageRepository {
  constructor(storageKey) {
    this.storageKey = storageKey;
  }

  get() {
    const data = localStorage.getItem(this.storageKey);
    return data ? JSON.parse(data) : null;
  }

  save(data) {
    localStorage.setItem(this.storageKey, JSON.stringify(data));
  }

  clear() {
    localStorage.removeItem(this.storageKey);
  }
}

/**
 * Entidad Usuario (Data Model)
 */
export class User {
  constructor({ id, fullName, email, password, testHistory = [], contactMessages = [] }) {
    this.id = id || crypto.randomUUID();
    this.fullName = fullName;
    this.email = email;
    this.password = password; // En entorno real debe manejarse con Hash
    this.testHistory = testHistory;
    this.contactMessages = contactMessages;
  }
}


/**
 * Servicio de Autenticación y Manejo de Sesión
 * Aplicando SOLID: Maneja la lógica de usuario sin acoplamiento a la interfaz.
 */
export class AuthService {
  constructor(storageRepo) {
    this.storage = storageRepo;
    this.currentUser = this.storage.get();
  }

  register(fullName, email, password) {
    const newUser = new User({ fullName, email, password });
    this.currentUser = newUser;
    this.storage.save(newUser);
    return newUser;
  }

  login(email, password) {
    const savedUser = this.storage.get();
    if (savedUser && savedUser.email === email && savedUser.password === password) {
      this.currentUser = new User(savedUser);
      return this.currentUser;
    }
    throw new Error("Credenciales inválidas");
  }

  logout() {
    this.currentUser = null;
    this.storage.clear();
  }

  isAuthenticated() {
    return this.currentUser !== null;
  }

  addTestRecord(testResult) {
    if (!this.isAuthenticated()) return;
    this.currentUser.testHistory.push(testResult);
    this.storage.save(this.currentUser);
  }
}
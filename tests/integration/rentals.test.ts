import {
  createRental,
  RENTAL_LIMITATIONS,
  insufficientAgeError,
  movieAlreadyInRental,
  pendentRentalError,
} from "./your-module"; // Importe seu módulo aqui
import usersRepository from "../repositories/users-repository";
import rentalsRepository from "../repositories/rentals-repository";
import moviesRepository from "../repositories/movies-repository";

jest.mock("../repositories/users-repository");
jest.mock("../repositories/rentals-repository");
jest.mock("../repositories/movies-repository");

describe("createRental", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should create a rental successfully", async () => {
    const userId = 1;
    const moviesId = [1];

    usersRepository.getById.mockResolvedValue({ id: userId, birthDate: "1990-01-01" });
    rentalsRepository.getRentalsByUserId.mockResolvedValue([]);
    moviesRepository.getById.mockResolvedValue({ id: 1, rentalId: null, adultsOnly: false });
    rentalsRepository.createRental.mockResolvedValue({ id: 1 });

    const rentalInput = { userId, moviesId };
    const rental = await createRental(rentalInput);

    expect(rental).toBeDefined();
    expect(rentalsRepository.createRental).toHaveBeenCalledWith(rentalInput);
  });

  it("should throw an error if user has a pending rental", async () => {
    const userId = 1;
    const moviesId = [1];

    // Simule as funções de repositório para retornar um aluguel pendente
    usersRepository.getById.mockResolvedValue({ id: userId });
    rentalsRepository.getRentalsByUserId.mockResolvedValue([{ id: 2, closed: false }]);

    const rentalInput = { userId, moviesId };

    await expect(createRental(rentalInput)).rejects.toThrow(pendentRentalError);
  });

  it("should throw an error if user is underage and there's an adult movie", async () => {
    const userId = 1;
    const moviesId = [1];

    usersRepository.getById.mockResolvedValue({ id: userId, birthDate: "2010-01-01" });
    rentalsRepository.getRentalsByUserId.mockResolvedValue([]);
    moviesRepository.getById.mockResolvedValue({ id: 1, rentalId: null, adultsOnly: true });

    const rentalInput = { userId, moviesId };

    await expect(createRental(rentalInput)).rejects.toThrow(insufficientAgeError);
  });

  it("should throw an error if trying to rent more than 4 movies", async () => {
    const userId = 1;
    const moviesId = [1, 2, 3, 4, 5];

    usersRepository.getById.mockResolvedValue({ id: userId, birthDate: "1990-01-01" });
    rentalsRepository.getRentalsByUserId.mockResolvedValue([]);
    moviesRepository.getById.mockResolvedValue({ id: 1, rentalId: null, adultsOnly: false });

    const rentalInput = { userId, moviesId };

    await expect(createRental(rentalInput)).rejects.toThrow("Maximum number of movies exceeded");
  });

  it("should throw an error if trying to rent a movie that is already in rental", async () => {
    const userId = 1;
    const moviesId = [1];

    usersRepository.getById.mockResolvedValue({ id: userId, birthDate: "1990-01-01" });
    rentalsRepository.getRentalsByUserId.mockResolvedValue([]);
    moviesRepository.getById.mockResolvedValue({ id: 1, rentalId: 2, adultsOnly: false });

    const rentalInput = { userId, moviesId };

    await expect(createRental(rentalInput)).rejects.toThrow(movieAlreadyInRental);
  });
});

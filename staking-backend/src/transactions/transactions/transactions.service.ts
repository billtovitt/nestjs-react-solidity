import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Transaction } from '../transaction.entity';
import { UpdateResult, DeleteResult } from 'typeorm';

@Injectable()
export class TransactionsService {
  constructor(
    @InjectRepository(Transaction)
    private transactionRepository: Repository<Transaction>,
  ) {}

  async findAll(): Promise<Transaction[]> {
    return await this.transactionRepository.find({ order: { id: 'DESC' } });
  }

  async create(contact: Transaction): Promise<Transaction> {
    return await this.transactionRepository.save(contact);
  }

  async update(contact: Transaction): Promise<UpdateResult> {
    return await this.transactionRepository.update(contact.id, contact);
  }

  async delete(id): Promise<DeleteResult> {
    return await this.transactionRepository.delete(id);
  }
}

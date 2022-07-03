import { Controller, Get } from '@nestjs/common';
import { Transaction } from './transaction.entity';
import { TransactionsService } from './transactions/transactions.service';
import { Post, Put, Delete, Body, Param } from '@nestjs/common';
import { ethers } from 'ethers';
import { StakingABI, StakingAddress } from '../config/stakingConf';

@Controller('transactions')
export class TransactionsController {
  constructor(private transactionsService: TransactionsService) {
    const provider = ethers.getDefaultProvider('rinkeby');
    const stakingContract = new ethers.Contract(
      StakingAddress,
      StakingABI,
      provider,
    );

    stakingContract.on('Staked', (owner, amount) => {
      var txData = {
        id: new Date().getTime(),
        owner,
        amount: Number(ethers.utils.formatEther(amount)),
        type: 1,
        time: new Date().getTime(),
      };
      this.transactionsService.create(txData);
    });

    stakingContract.on('UnStaked', (owner, amount) => {
      var txData = {
        id: new Date().getTime(),
        owner,
        amount: Number(ethers.utils.formatEther(amount)),
        type: 2,
        time: new Date().getTime(),
      };
      this.transactionsService.create(txData);
    });

    stakingContract.on('Claimed', (owner, amount) => {
      var txData = {
        id: new Date().getTime(),
        owner,
        amount: Number(ethers.utils.formatEther(amount)),
        type: 3,
        time: new Date().getTime(),
      };
      this.transactionsService.create(txData);
    });
  }
  @Get()
  index(): Promise<Transaction[]> {
    return this.transactionsService.findAll();
  }
  @Post('create')
  async create(@Body() transactionData: Transaction): Promise<any> {
    return this.transactionsService.create(transactionData);
  }
  @Put(':id/update')
  async update(
    @Param('id') id,
    @Body() transactionData: Transaction,
  ): Promise<any> {
    transactionData.id = Number(id);
    console.log('Update #' + transactionData.id);
    return this.transactionsService.update(transactionData);
  }
  @Delete(':id/delete')
  async delete(@Param('id') id): Promise<any> {
    return this.transactionsService.delete(id);
  }
}

import { solidityKeccak256 } from 'ethers/lib/utils'
import { ethers } from 'hardhat'

const { HashZero, AddressZero } = ethers.constants
export const ONE_DAY = 60 * 60 * 24

export interface RoleAssignment {
  nonce: number
  role: string
  tokenAddress: string
  tokenId: number
  tokenAmount: number
  grantor: string
  grantee: string
  expirationDate: number
  revocable: boolean
  data: string
}

export function generateRandomInt() {
  return Math.floor(Math.random() * 1000 * 1000) + 1
}

export const wearableIds = [201, 224, 218, 211]
export const wearableAmounts = [2000, 2000, 2000, 2000]
export const aavegotchiDiamondAddress = "0x86935F11C86623deC8a25696E1C19a8659CbF95d";
export const wearableDiamondAddress = "0x58de9AaBCaeEC0f69883C94318810ad79Cc6a44f";
export async function buildRoleAssignment({
  // default values
  nonce = generateRandomInt(),
  role = 'EQUIP_WEARABLE_ROLE',
  tokenAddress = wearableDiamondAddress,
  tokenId = wearableIds[0],
  tokenAmount = 1,
  grantor = AddressZero,
  grantee = AddressZero,
  expirationDate = null,
  revocable = true,
  data = HashZero,
}: {
  // types
  nonce?: number
  role?: string
  tokenAddress?: string
  tokenId?: number
  tokenAmount?: number
  grantor?: string
  grantee?: string
  expirationDate?: number | null
  revocable?: boolean
  data?: string
} = {}): Promise<RoleAssignment> {
  return {
    nonce,
    role: generateRoleId(role),
    tokenAddress,
    tokenId,
    tokenAmount,
    grantor,
    grantee,
    expirationDate: expirationDate ? expirationDate : (await time.latest()) + ONE_DAY,
    revocable,
    data,
  }
}

export function generateRoleId(role: string) {
  return solidityKeccak256(['string'], [role])
}

export class time {
  static increase = async (seconds: number) => {
    await ethers.provider.send('evm_increaseTime', [seconds])
    await ethers.provider.send('evm_mine', [])
  }

  static latest = async () => {
    const block = await ethers.provider.getBlock('latest')
    return block.timestamp
  }
}

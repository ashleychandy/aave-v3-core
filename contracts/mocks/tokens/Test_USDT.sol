// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ERC20} from '../../dependencies/openzeppelin/contracts/ERC20.sol';
import {Ownable} from '../../dependencies/openzeppelin/contracts/Ownable.sol';

contract Test_USDT is ERC20, Ownable {
  mapping(address => bool) private s_userToMinted;

  constructor() ERC20('Test_USDT', 'TUSDT') {
    _setupDecimals(6); // USDT uses 6 decimals
  }

  /// @notice Owner function to mint USDT to an address
  /// @param to Address to mint to
  /// @param amount Amount of USDT to mint - ADD 6 DECIMALS (e.g., 100 USDT = 100 * 1e6)
  function mint(address to, uint256 amount) external onlyOwner {
    _mint(to, amount);
  }

  function airdrop() external {
    if (!s_userToMinted[msg.sender]) {
      s_userToMinted[msg.sender] = true;
      _mint(msg.sender, 5000 * 1e6); // 5000 USDT with 6 decimals
    } else {
      revert('Already minted');
    }
  }
}

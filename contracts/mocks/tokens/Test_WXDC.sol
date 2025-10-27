// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {ERC20} from '../../dependencies/openzeppelin/contracts/ERC20.sol';
import {Ownable} from '../../dependencies/openzeppelin/contracts/Ownable.sol';

contract Test_WXDC is ERC20, Ownable {
  mapping(address => bool) private s_userToMinted;

  constructor() ERC20('Test_WXDC', 'TWXDC') {
    _setupDecimals(6); // WXDC uses 6 decimals
  }

  /// @notice Owner function to mint WXDC to an address
  /// @param to Address to mint to
  /// @param amount Amount of WXDC to mint - ADD 6 DECIMALS (e.g., 100 WXDC = 100 * 1e6)
  function mint(address to, uint256 amount) external onlyOwner {
    _mint(to, amount);
  }

  function airdrop() external {
    if (!s_userToMinted[msg.sender]) {
      s_userToMinted[msg.sender] = true;
      _mint(msg.sender, 5000 * 1e6); // 5000 WXDC with 6 decimals
    } else {
      revert('Already minted');
    }
  }
}

// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

/**
 * @title XDCPriceFeedAdapter
 * @notice Adapter to make XDC price feeds compatible with AAVE Oracle
 * @dev Wraps the XDC IFeeds interface to match Chainlink's AggregatorV3Interface
 */
interface IFeeds {
  function latestAnswer() external view returns (uint256);

  function latestRoundData() external view returns (uint80, uint256, uint256, uint256, uint80);

  function decimals() external view returns (uint8);

  function latestRound() external view returns (uint256);

  function description() external view returns (string memory);
}

contract XDCPriceFeedAdapter {
  IFeeds public immutable xdcFeed;
  string private _description;

  constructor(address _xdcFeed, string memory description_) {
    require(_xdcFeed != address(0), 'Invalid feed address');
    xdcFeed = IFeeds(_xdcFeed);
    _description = description_;
  }

  /**
   * @notice Returns the latest price
   * @return The latest price with 8 decimals
   */
  function latestAnswer() external view returns (int256) {
    uint256 price = xdcFeed.latestAnswer();
    return int256(price);
  }

  /**
   * @notice Returns the latest round data
   * @return roundId The round ID
   * @return answer The price
   * @return startedAt Timestamp when the round started
   * @return updatedAt Timestamp when the round was updated
   * @return answeredInRound The round ID in which the answer was computed
   */
  function latestRoundData()
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    (
      uint80 _roundId,
      uint256 _answer,
      uint256 _startedAt,
      uint256 _updatedAt,
      uint80 _answeredInRound
    ) = xdcFeed.latestRoundData();

    return (_roundId, int256(_answer), _startedAt, _updatedAt, _answeredInRound);
  }

  /**
   * @notice Returns the number of decimals
   * @return The number of decimals (should be 8 for price feeds)
   */
  function decimals() external view returns (uint8) {
    return xdcFeed.decimals();
  }

  /**
   * @notice Returns the description of the feed
   * @return The description string
   */
  function description() external view returns (string memory) {
    return _description;
  }

  /**
   * @notice Returns the version of the aggregator
   * @return The version number
   */
  function version() external pure returns (uint256) {
    return 1;
  }

  /**
   * @notice Get data from a specific round
   * @param _roundId The round ID
   * @return roundId The round ID
   * @return answer The price
   * @return startedAt Timestamp when the round started
   * @return updatedAt Timestamp when the round was updated
   * @return answeredInRound The round ID in which the answer was computed
   */
  function getRoundData(
    uint80 _roundId
  )
    external
    view
    returns (
      uint80 roundId,
      int256 answer,
      uint256 startedAt,
      uint256 updatedAt,
      uint80 answeredInRound
    )
  {
    // XDC feeds may not support historical data, return latest
    return this.latestRoundData();
  }
}

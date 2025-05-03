// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract Affidavit {
    struct AffidavitData {
        string displayId;
        string title;
        string category;
        string issuerId;
        string issuerIdCardNumber;
        string[] partyIds;
        string[] partyIdCardNumbers;
        string[] witnessNames;
        string[] witnessIdCardNumbers;
        string status;
        uint256 timestamp;
    }

    mapping(string => AffidavitData) public affidavits;
    mapping(string => bool) public affidavitExists;

    event AffidavitStored(string displayId, string status, uint256 timestamp);

    function storeAffidavit(
        string memory _displayId,
        string memory _title,
        string memory _category,
        string memory _issuerId,
        string memory _issuerIdCardNumber,
        string[] memory _partyIds,
        string[] memory _partyIdCardNumbers,
        string[] memory _witnessNames,
        string[] memory _witnessIdCardNumbers,
        string memory _status
    ) public {
        require(!affidavitExists[_displayId], "Affidavit already exists");
        affidavits[_displayId] = AffidavitData(
            _displayId,
            _title,
            _category,
            _issuerId,
            _issuerIdCardNumber,
            _partyIds,
            _partyIdCardNumbers,
            _witnessNames,
            _witnessIdCardNumbers,
            _status,
            block.timestamp
        );
        affidavitExists[_displayId] = true;
        emit AffidavitStored(_displayId, _status, block.timestamp);
    }

    function updateAffidavitStatus(string memory _displayId, string memory _status) public {
        require(affidavitExists[_displayId], "Affidavit does not exist");
        affidavits[_displayId].status = _status;
        emit AffidavitStored(_displayId, _status, block.timestamp);
    }

    function getAffidavit(string memory _displayId) public view returns (AffidavitData memory) {
        require(affidavitExists[_displayId], "Affidavit does not exist");
        return affidavits[_displayId];
    }
}
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AffidavitRegistry {
    struct Affidavit {
        string affidavitId;
        string title;
        string category;
        string description;
        string declaration;
        string issuerId; // Changed from address to string
        string sellerId; // Changed from address to string
        string buyerId; // Changed from address to string
        string[] witnessIds;
        string[] ipfsHashes; // Changed to array
        string dataHash; // Hash of all MongoDB data
        uint256 timestamp;
        bool onBlockchain;
    }

    // Mapping from affidavit ID to Affidavit struct
    mapping(string => Affidavit) private affidavits;
    
    // Mapping from user ID to their affidavit IDs
    mapping(string => string[]) private userAffidavits;
    
    // Array of all affidavit IDs
    string[] private allAffidavitIds;

    // Events
    event AffidavitCreated(string affidavitId, string issuerId, uint256 timestamp);
    event AffidavitRevoked(string affidavitId, string issuerId, uint256 timestamp);

    /**
     * @dev Create a new affidavit
     * @param _affidavitId Unique identifier for the affidavit
     * @param _title Title of the affidavit
     * @param _category Category of the affidavit
     * @param _description Description of the affidavit
     * @param _declaration Declaration text of the affidavit
     * @param _issuerId ID of the issuer
     * @param _sellerId ID of the seller (if applicable)
     * @param _buyerId ID of the buyer (if applicable)
     * @param _witnessIds Array of witness IDs
     * @param _ipfsHashes Array of IPFS hashes where additional documents are stored
     * @param _dataHash Hash of all affidavit data
     */
    function createAffidavit(
        string memory _affidavitId,
        string memory _title,
        string memory _category,
        string memory _description,
        string memory _declaration,
        string memory _issuerId,
        string memory _sellerId,
        string memory _buyerId,
        string[] memory _witnessIds,
        string[] memory _ipfsHashes,
        string memory _dataHash
    ) public {
        require(bytes(affidavits[_affidavitId].affidavitId).length == 0, "Affidavit already exists");
        
        Affidavit memory newAffidavit = Affidavit({
            affidavitId: _affidavitId,
            title: _title,
            category: _category,
            description: _description,
            declaration: _declaration,
            issuerId: _issuerId,
            sellerId: _sellerId,
            buyerId: _buyerId,
            witnessIds: _witnessIds,
            ipfsHashes: _ipfsHashes,
            dataHash: _dataHash,
            timestamp: block.timestamp,
            onBlockchain: true
        });
        
        affidavits[_affidavitId] = newAffidavit;
        allAffidavitIds.push(_affidavitId);
        
        userAffidavits[_issuerId].push(_affidavitId);
        if (bytes(_sellerId).length > 0) {
            userAffidavits[_sellerId].push(_affidavitId);
        }
        if (bytes(_buyerId).length > 0) {
            userAffidavits[_buyerId].push(_affidavitId);
        }
        
        emit AffidavitCreated(_affidavitId, _issuerId, block.timestamp);
    }

    /**
     * @dev Revoke an existing affidavit
     * @param _affidavitId ID of the affidavit to revoke
     */
    function revokeAffidavit(string memory _affidavitId) public {
        require(bytes(affidavits[_affidavitId].affidavitId).length > 0, "Affidavit does not exist");
        require(
            keccak256(abi.encodePacked(affidavits[_affidavitId].issuerId)) == keccak256(abi.encodePacked(msg.sender)),
            "Only issuer can revoke"
        );
        emit AffidavitRevoked(_affidavitId, affidavits[_affidavitId].issuerId, block.timestamp);
    }

    /**
     * @dev Get affidavit details
     * @param _affidavitId ID of the affidavit to retrieve
     */
    function getAffidavit(string memory _affidavitId) public view returns (
        string memory affidavitId,
        string memory title,
        string memory category,
        string memory description,
        string memory declaration,
        string memory issuerId,
        string memory sellerId,
        string memory buyerId,
        string[] memory ipfsHashes,
        string memory dataHash,
        uint256 timestamp,
        bool onBlockchain
    ) {
        Affidavit storage aff = affidavits[_affidavitId];
        require(bytes(aff.affidavitId).length > 0, "Affidavit does not exist");
        
        return (
            aff.affidavitId,
            aff.title,
            aff.category,
            aff.description,
            aff.declaration,
            aff.issuerId,
            aff.sellerId,
            aff.buyerId,
            aff.ipfsHashes,
            aff.dataHash,
            aff.timestamp,
            aff.onBlockchain
        );
    }

    /**
     * @dev Get witness IDs for an affidavit
     * @param _affidavitId ID of the affidavit
     */
    function getWitnesses(string memory _affidavitId) public view returns (string[] memory) {
        require(bytes(affidavits[_affidavitId].affidavitId).length > 0, "Affidavit does not exist");
        return affidavits[_affidavitId].witnessIds;
    }

    /**
     * @dev Get all affidavits for a user
     * @param _userId ID of the user
     */
    function getUserAffidavits(string memory _userId) public view returns (string[] memory) {
        return userAffidavits[_userId];
    }

    /**
     * @dev Get count of all affidavits
     */
    function getAffidavitCount() public view returns (uint256) {
        return allAffidavitIds.length;
    }

    /**
     * @dev Verify if an affidavit exists and is on blockchain
     * @param _affidavitId ID of the affidavit to verify
     */
    function verifyAffidavit(string memory _affidavitId) public view returns (bool exists, bool onBlockchain) {
        exists = bytes(affidavits[_affidavitId].affidavitId).length > 0;
        onBlockchain = exists && affidavits[_affidavitId].onBlockchain;
        return (exists, onBlockchain);
    }
}
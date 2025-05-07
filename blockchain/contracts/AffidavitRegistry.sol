// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract AffidavitRegistry {
    struct Affidavit {
        string affidavitId;
        string title;
        string category;
        string description;
        string declaration;
        address issuer;
        address seller;
        address buyer;
        string[] witnessIds;
        string ipfsHash;
        uint256 timestamp;
        bool onBlockchain;
    }

    // Mapping from affidavit ID to Affidavit struct
    mapping(string => Affidavit) private affidavits;
    
    // Mapping from user address to their affidavit IDs
    mapping(address => string[]) private userAffidavits;
    
    // Array of all affidavit IDs
    string[] private allAffidavitIds;

    // Events
    event AffidavitCreated(string affidavitId, address issuer, uint256 timestamp);
    event AffidavitRevoked(string affidavitId, address issuer, uint256 timestamp);

    /**
     * @dev Create a new affidavit
     * @param _affidavitId Unique identifier for the affidavit
     * @param _title Title of the affidavit
     * @param _category Category of the affidavit
     * @param _description Description of the affidavit
     * @param _declaration Declaration text of the affidavit
     * @param _issuer Address of the issuer
     * @param _seller Address of the seller (if applicable)
     * @param _buyer Address of the buyer (if applicable)
     * @param _witnessIds Array of witness IDs (could be hashed identifiers)
     * @param _ipfsHash IPFS hash where additional documents are stored
     */
    function createAffidavit(
        string memory _affidavitId,
        string memory _title,
        string memory _category,
        string memory _description,
        string memory _declaration,
        address _issuer,
        address _seller,
        address _buyer,
        string[] memory _witnessIds,
        string memory _ipfsHash
    ) public {
        // Ensure affidavit doesn't already exist
        require(bytes(affidavits[_affidavitId].affidavitId).length == 0, "Affidavit already exists");
        
        // Create new affidavit
        Affidavit memory newAffidavit = Affidavit({
            affidavitId: _affidavitId,
            title: _title,
            category: _category,
            description: _description,
            declaration: _declaration,
            issuer: _issuer,
            seller: _seller,
            buyer: _buyer,
            witnessIds: _witnessIds,
            ipfsHash: _ipfsHash,
            timestamp: block.timestamp,
            onBlockchain: true
        });
        
        // Store affidavit
        affidavits[_affidavitId] = newAffidavit;
        allAffidavitIds.push(_affidavitId);
        
        // Add to user's affidavits
        userAffidavits[_issuer].push(_affidavitId);
        if (_seller != address(0)) {
            userAffidavits[_seller].push(_affidavitId);
        }
        if (_buyer != address(0)) {
            userAffidavits[_buyer].push(_affidavitId);
        }
        
        // Emit event
        emit AffidavitCreated(_affidavitId, _issuer, block.timestamp);
    }

    /**
     * @dev Revoke an existing affidavit
     * @param _affidavitId ID of the affidavit to revoke
     */
    function revokeAffidavit(string memory _affidavitId) public {
        // Ensure affidavit exists
        require(bytes(affidavits[_affidavitId].affidavitId).length > 0, "Affidavit does not exist");
        
        // Ensure caller is the issuer
        require(affidavits[_affidavitId].issuer == msg.sender, "Only issuer can revoke");
        
        // Emit event
        emit AffidavitRevoked(_affidavitId, msg.sender, block.timestamp);
    }

    /**
     * @dev Get affidavit details
     * @param _affidavitId ID of the affidavit to retrieve
     * @return affidavitId Unique identifier
     * @return title Title of the affidavit
     * @return category Category of the affidavit
     * @return description Description of the affidavit
     * @return declaration Declaration text
     * @return issuer Address of the issuer
     * @return seller Address of the seller
     * @return buyer Address of the buyer
     * @return ipfsHash IPFS hash of additional documents
     * @return timestamp Creation timestamp
     * @return onBlockchain Whether the affidavit is stored on blockchain
     */
    function getAffidavit(string memory _affidavitId) public view returns (
        string memory affidavitId,
        string memory title,
        string memory category,
        string memory description,
        string memory declaration,
        address issuer,
        address seller,
        address buyer,
        string memory ipfsHash,
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
            aff.issuer,
            aff.seller,
            aff.buyer,
            aff.ipfsHash,
            aff.timestamp,
            aff.onBlockchain
        );
    }

    /**
     * @dev Get witness IDs for an affidavit
     * @param _affidavitId ID of the affidavit
     * @return Array of witness IDs
     */
    function getWitnesses(string memory _affidavitId) public view returns (string[] memory) {
        require(bytes(affidavits[_affidavitId].affidavitId).length > 0, "Affidavit does not exist");
        return affidavits[_affidavitId].witnessIds;
    }

    /**
     * @dev Get all affidavits for a user
     * @param _user Address of the user
     * @return Array of affidavit IDs
     */
    function getUserAffidavits(address _user) public view returns (string[] memory) {
        return userAffidavits[_user];
    }

    /**
     * @dev Get count of all affidavits
     * @return Count of affidavits
     */
    function getAffidavitCount() public view returns (uint256) {
        return allAffidavitIds.length;
    }

    /**
     * @dev Verify if an affidavit exists and is on blockchain
     * @param _affidavitId ID of the affidavit to verify
     * @return exists Whether the affidavit exists
     * @return onBlockchain Whether the affidavit is on blockchain
     */
    function verifyAffidavit(string memory _affidavitId) public view returns (bool exists, bool onBlockchain) {
        exists = bytes(affidavits[_affidavitId].affidavitId).length > 0;
        onBlockchain = exists && affidavits[_affidavitId].onBlockchain;
        return (exists, onBlockchain);
    }
}
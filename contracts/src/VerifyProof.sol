// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

interface IVerifyProofAggregation {
    function verifyProofAggregation(
        uint256 _domainId,
        uint256 _aggregationId,
        bytes32 _leaf,
        bytes32[] calldata _merklePath,
        uint256 _leafCount,
        uint256 _index
    ) external view returns (bool);
}

contract verifyProof {

    bytes32 public constant PROVING_SYSTEM_ID = keccak256(abi.encodePacked("groth16"));
    bytes32 public constant VERSION_HASH = sha256(abi.encodePacked(""));

    address public zkVerify;
    bytes32 public vkey;

    event ProofVerified(
        address indexed verifier,
        uint256 aggregationId,
        uint256 domainId,
        bool isValid
    );

    constructor(
        address _zkVerify,
        bytes32 _vkey
    ){
        zkVerify = _zkVerify;
        vkey = _vkey;
    }

    function _base64Encode(bytes memory data) internal pure returns (string memory) {
        bytes memory table = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
        uint256 len = data.length;
        if (len == 0) return "";

        uint256 encodedLen = 4 * ((len + 2) / 3);
        bytes memory result = new bytes(encodedLen);

        uint256 i = 0;
        uint256 j = 0;

        while (i < len) {
            uint256 a = i < len ? uint8(data[i++]) : 0;
            uint256 b = i < len ? uint8(data[i++]) : 0;
            uint256 c = i < len ? uint8(data[i++]) : 0;

            uint256 triple = (a << 16) + (b << 8) + c;

            result[j++] = table[triple >> 18 & 0x3F];
            result[j++] = table[triple >> 12 & 0x3F];
            result[j++] = table[triple >> 6 & 0x3F];
            result[j++] = table[triple & 0x3F];
        }

        // Adjust padding
        while (j > 0 && result[j - 1] == "=") {
            j--;
        }

        assembly {
            mstore(result, j)
        }

        return string(result);
    }

    function verify(
        uint256 _aggregationId,
        uint256 _domainId,
        bytes32[] calldata _merklePath,
        bytes32 leaf,
        uint256 _leafCount,
        uint256 _index
    ) external {

        bool valid = IVerifyProofAggregation(zkVerify).verifyProofAggregation(
            _domainId,
            _aggregationId,
            leaf,
            _merklePath,
            _leafCount,
            _index
        );
        require(valid, "Invalid proof");

        // Emit events
        emit ProofVerified(msg.sender, _aggregationId, _domainId, valid);
    }
}